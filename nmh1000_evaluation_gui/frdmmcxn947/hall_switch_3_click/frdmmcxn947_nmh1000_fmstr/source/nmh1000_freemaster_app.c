/*
 * Copyright 2024 NXP
 * All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */

/**
 * @file nmh1000_freemaster_app.c
 * @brief The nmh1000_freemaster_app.c file implements FreeMASTER demo using the ISSDK
 *        NMH1000 sensor driver example demonstration with interrupt mode.
 */

//-----------------------------------------------------------------------
// SDK Includes
//-----------------------------------------------------------------------
#include "pin_mux.h"
#include "clock_config.h"
#include "board.h"
#include "fsl_debug_console.h"
#include "math.h"
#ifndef CPU_LPC55S16JBD100
#include "fsl_lpuart.h"
#else
#include "fsl_usart.h"
#endif
#include "fsl_common.h"
#include "freemaster.h"
#include "freemaster_serial_uart.h"
//-----------------------------------------------------------------------
// CMSIS Includes
//-----------------------------------------------------------------------
#include "Driver_I2C.h"

//-----------------------------------------------------------------------
// ISSDK Includes
//-----------------------------------------------------------------------
#include "issdk_hal.h"
#include "nmh1000_drv.h"
#include "gpio_driver.h"
#include "systick_utils.h"


#define NMH1000_DATA_SIZE (1) /* 1 byte Mag Data. */
#define NMH1000_NUM_REGISTERS (NMH1000_I2C_ADDR + 1)
#define THRESHOLD 50

/*! @brief Register settings for Normal Mode. */
const registerwritelist_t cNmh1000ConfigNormal[] = {
    {NMH1000_ODR, NMH1000_USER_ODR_ODR_10X_HSP, NMH1000_USER_ODR_ODR_MASK},
    {NMH1000_CONTROL_REG1, NMH1000_CONTROL_REG1_AUTO_MODE_START, NMH1000_CONTROL_REG1_AUTO_MODE_MASK},
    __END_WRITE_DATA__};

/*! @brief Address and size of Raw Pressure+Temperature Data in Normal Mode. */
const registerreadlist_t cNmh1000OutputNormal[] = {{.readFrom = NMH1000_OUT_M_REG, .numBytes = NMH1000_DATA_SIZE},
                                                 __END_READ_DATA__};


/*******************************************************************************
 * Global Variables
 ******************************************************************************/
/*! @brief This structure defines the host_io application output variables.*/
typedef struct
{
    /* Define your host_io application output variables here */
    uint8_t m_out;
    uint8_t odr;
    uint8_t offset;
    uint8_t value;
    uint8_t trigger;
    uint8_t read_offset;
    uint8_t read_value;
    uint8_t read_trigger;
    uint8_t readall_value[NMH1000_NUM_REGISTERS];
    uint8_t readall_size;
    uint8_t readall_trigger;
    uint8_t threshold;
    uint8_t mag_switch_flag;
} host_io_output_vars_t;

host_io_output_vars_t registers;

static void init_freemaster_lpuart(void);
static int32_t apply_register_write(nmh1000_i2c_sensorhandle_t nmh1000Driver, uint8_t offset, uint8_t value);
static int32_t apply_register_read(nmh1000_i2c_sensorhandle_t nmh1000Driver, uint8_t read_offset, uint8_t *read_value);
static int32_t apply_register_readall(nmh1000_i2c_sensorhandle_t nmh1000Driver, host_io_output_vars_t *registers);

/*! @brief Target-side Address (TSA) translation structures and macros
 *  With TSA enabled, the user describes the global and static variables using
 *  TSA tables. There can be any number of tables defined in the project files.
 *  Each table can have the identifier which should be unique across the project.
 */
FMSTR_TSA_TABLE_BEGIN(main_table)
    /* Add host_io output variables struct to TSA mapped memory */
	FMSTR_TSA_STRUCT(host_io_output_vars_t)

	FMSTR_TSA_MEMBER(host_io_output_vars_t, m_out, FMSTR_TSA_UINT8)
	FMSTR_TSA_MEMBER(host_io_output_vars_t, odr, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, offset, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, value, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, trigger, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, read_offset, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, read_value, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, read_trigger, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, readall_value, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, readall_size, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, readall_trigger, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, threshold, FMSTR_TSA_UINT8)
    FMSTR_TSA_MEMBER(host_io_output_vars_t, mag_switch_flag, FMSTR_TSA_UINT8)

	/* Declare TSA memory mapped output variables as Read-Write(RW) or READ-ONLY(RO) */
	FMSTR_TSA_RW_VAR(registers, FMSTR_TSA_USERTYPE(host_io_output_vars_t))
FMSTR_TSA_TABLE_END()

FMSTR_TSA_TABLE_LIST_BEGIN()
    FMSTR_TSA_TABLE(main_table)
FMSTR_TSA_TABLE_LIST_END()

/*******************************************************************************
 * Code
 ******************************************************************************/
/*! -----------------------------------------------------------------------
 *  @brief       This is the The main function implementation.
 *  @details     This function invokes board initializes routines, then then brings up the sensor and
 *               finally enters an endless loop to continuously read available samples.
 *  @param[in]   void This is no input parameter.
 *  @return      void  There is no return value.
 *  @constraints None
 *  @reentrant  No
 *  -----------------------------------------------------------------------*/
int main(void)
{
	uint8_t status;
    nmh1000_i2c_sensorhandle_t nmh1000Driver;
    ARM_DRIVER_I2C *I2Cdrv = &I2C_S_DRIVER;
    GENERIC_DRIVER_GPIO *gpioDriver = &Driver_GPIO_KSDK;

    /*! Initialize the MCU hardware. */
    BOARD_InitPins();
    BOARD_BootClockRUN();
    BOARD_SystickEnable();
    BOARD_InitDebugConsole();

    /*! Initialize the I2C driver. */
    status = I2Cdrv->Initialize(I2C_S_SIGNAL_EVENT);
    if (ARM_DRIVER_OK != status)
    {
        return -1;
    }

    /*! Set the I2C Power mode. */
    status = I2Cdrv->PowerControl(ARM_POWER_FULL);
    if (ARM_DRIVER_OK != status)
    {
        return -1;
    }

    /*! Set the I2C bus speed. */
    status = I2Cdrv->Control(ARM_I2C_BUS_SPEED, ARM_I2C_BUS_SPEED_FAST);
    if (ARM_DRIVER_OK != status)
    {
        return -1;
    }

    /*! Initialize RGB LED pin used by FRDM board */
    gpioDriver->pin_init(&GREEN_LED, GPIO_DIRECTION_OUT, NULL, NULL, NULL);

	status = NMH1000_I2C_Initialize(&nmh1000Driver, &I2C_S_DRIVER, I2C_S_DEVICE_INDEX, NMH1000_I2C_ADDR_VAL,
			NMH1000_WHO_AM_I_VALUE);
    if (SENSOR_ERROR_NONE != status)
    {
        //PRINTF("\r\n NMH1000 Sensor Initialization Failed, Err = %d\r\n", status);
        return -1;
    }

    uint8_t magData = 0;
    registers.threshold = 50;

    /*! Configure the NMH1000 sensor. */
    status = NMH1000_I2C_Configure(&nmh1000Driver, cNmh1000ConfigNormal);
    if (SENSOR_ERROR_NONE != status)
    {
        //PRINTF("\r\nNMH1000 now active and entering data read loop...\r\n");
        return -1;
    }

    /* FreeMASTER comm Initalization */
    init_freemaster_lpuart();

    /*! FreeMASTER Driver Initialization */
    FMSTR_Init();

	for(;;) /* Forever loop */
	{
    	/*! FreeMASTER host communication polling mode */
		FMSTR_Poll();

	    /*! Check for any write register trigger from Host */
		if (registers.trigger == 1)
		{
		    /*! Apply Register Write */
			status = apply_register_write(nmh1000Driver, registers.offset, registers.value);
		    if (SENSOR_ERROR_NONE != status)
		    {
                return status;
		    }

		    if (registers.offset == NMH1000_ODR)
		    {
		    	registers.odr = registers.value;
		    }
		    registers.trigger = 0;
		}

	    /*! Check for any read register trigger from Host */
		if (registers.read_trigger == 1)
		{
		    /*! Apply Register Write */
			status = apply_register_read(nmh1000Driver, registers.read_offset, &(registers.read_value));
		    if (SENSOR_ERROR_NONE != status)
		    {
	            return status;
		    }
		    if (registers.offset == NMH1000_ODR)
		    {
		    	registers.odr = registers.read_value;
		    }
		    registers.read_trigger = 0;
		}

	    /*! Check for any read all register trigger from Host */
		if (registers.readall_trigger == 1)
		{
		    /*! Apply Register Write */
			status = apply_register_readall(nmh1000Driver, &registers);
		    if (SENSOR_ERROR_NONE != status)
		    {
	            return status;
		    }
		    if (registers.offset == NMH1000_ODR)
		    {
		    	registers.odr = registers.readall_value[NMH1000_ODR];
		    }
		    registers.readall_trigger = 0;
		    registers.readall_size = NMH1000_I2C_ADDR;
		}

		/* get the mag output data */
        status = NMH1000_I2C_ReadData(&nmh1000Driver, cNmh1000OutputNormal, &magData);
        if (ARM_DRIVER_OK != status)
        {
            return -1;
        }

        /* Update the mag output in TSA memory mapped variable */
        registers.m_out = magData;
        if (registers.m_out > registers.threshold)
        {
        	registers.mag_switch_flag = 1;
        	gpioDriver->clr_pin(&GREEN_LED);
        }
        else
        {
        	registers.mag_switch_flag = 0;
        	gpioDriver->set_pin(&GREEN_LED);
        }
	}
 }

/*!
 * @brief Service register write trigger from Host
 */
int32_t apply_register_write(nmh1000_i2c_sensorhandle_t nmh1000Driver, uint8_t offset, uint8_t value)
{
    int32_t status;

	if (offset > NMH1000_NUM_REGISTERS)
	{
		return SENSOR_ERROR_INVALID_PARAM;
	}

	registerwritelist_t nmh1000_register_write[] = {
	     /*! Set register offset with provided value */
	     {offset, value, 0},
	      __END_WRITE_DATA__};

    status = NMH1000_I2C_Configure(&nmh1000Driver, nmh1000_register_write);
    if (SENSOR_ERROR_NONE != status)
    {
        return SENSOR_ERROR_WRITE;
    }

    return SENSOR_ERROR_NONE;
}

/*!
 * @brief Service register read trigger from Host
 */
int32_t apply_register_read(nmh1000_i2c_sensorhandle_t nmh1000Driver, uint8_t read_offset, uint8_t *read_value)
{
    int32_t status;

	if (read_offset > NMH1000_NUM_REGISTERS)
	{
		return SENSOR_ERROR_INVALID_PARAM;
	}

	registerreadlist_t nmh1000_register_read[] = {
		     /*! Set register offset with provided value */
	        {.readFrom = read_offset, .numBytes = 1}, __END_READ_DATA__};

    status = NMH1000_I2C_ReadData(&nmh1000Driver, nmh1000_register_read, read_value);
    if (SENSOR_ERROR_NONE != status)
    {
        return SENSOR_ERROR_WRITE;
    }

    return SENSOR_ERROR_NONE;
}

/*!
 * @brief Service register read all trigger from Host
 */
int32_t apply_register_readall(nmh1000_i2c_sensorhandle_t nmh1000Driver, host_io_output_vars_t *registers)
{
    int32_t status;

	for (int reg_offset = NMH1000_STATUS; reg_offset <= NMH1000_I2C_ADDR; reg_offset++)
	{
		registerreadlist_t nmh1000_register_readall[] = {
				 /*! Set register offset with provided value */
				{.readFrom = reg_offset, .numBytes = 1}, __END_READ_DATA__};
		status = NMH1000_I2C_ReadData(&nmh1000Driver, nmh1000_register_readall, &(registers->readall_value[reg_offset]));
		if (SENSOR_ERROR_NONE != status)
		{
			return SENSOR_ERROR_READ;
		}
	}

    return SENSOR_ERROR_NONE;
}

/*!
 * @brief LPUART Module initialization (LPUART is a the standard block included e.g. in K66F)
 */
static void init_freemaster_lpuart(void)
{
    lpuart_config_t config;

    /*
     * config.baudRate_Bps = 115200U;
     * config.parityMode = kUART_ParityDisabled;
     * config.stopBitCount = kUART_OneStopBit;
     * config.txFifoWatermark = 0;
     * config.rxFifoWatermark = 1;
     * config.enableTx = false;
     * config.enableRx = false;
     */
    LPUART_GetDefaultConfig(&config);
    config.baudRate_Bps = 115200U;
    config.enableTx     = false;
    config.enableRx     = false;

    LPUART_Init((LPUART_Type *)BOARD_DEBUG_UART_BASEADDR, &config, BOARD_DEBUG_UART_CLK_FREQ);

    /* Register communication module used by FreeMASTER driver. */
    FMSTR_SerialSetBaseAddress((LPUART_Type *)BOARD_DEBUG_UART_BASEADDR);

#if FMSTR_SHORT_INTR || FMSTR_LONG_INTR
    /* Enable UART interrupts. */
    EnableIRQ(BOARD_UART_IRQ);
    EnableGlobalIRQ(0);
#endif
}

#if FMSTR_SHORT_INTR || FMSTR_LONG_INTR
/*
 *   Application interrupt handler of communication peripheral used in interrupt modes
 *   of FreeMASTER communication.
 *
 *   NXP MCUXpresso SDK framework defines interrupt vector table as a part of "startup_XXXXXX.x"
 *   assembler/C file. The table points to weakly defined symbols, which may be overwritten by the
 *   application specific implementation. FreeMASTER overrides the original weak definition and
 *   redirects the call to its own handler.
 *
 */

void BOARD_UART_IRQ_HANDLER(void)
{
    /* Call FreeMASTER Interrupt routine handler */
    FMSTR_SerialIsr();
}
#endif
