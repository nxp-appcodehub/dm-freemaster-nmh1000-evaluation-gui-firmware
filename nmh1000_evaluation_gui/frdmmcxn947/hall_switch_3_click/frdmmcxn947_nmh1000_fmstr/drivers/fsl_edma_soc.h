/*
 * Copyright 2022 NXP
 * All rights reserved.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */
#ifndef _FSL_EDMA_SOC_H_
#define _FSL_EDMA_SOC_H_

#include "fsl_common.h"

/*!
 * @addtogroup edma_soc
 * @{
 */

/*******************************************************************************
 * Definitions
 ******************************************************************************/
/*! @name Driver version */
/*@{*/
/*! @brief Driver version 1.0.0. */
#define FSL_EDMA_SOC_DRIVER_VERSION (MAKE_VERSION(1, 0, 0))
/*@}*/

/*!@brief DMA IP version */
#define FSL_EDMA_SOC_IP_DMA3 (1)
#define FSL_EDMA_SOC_IP_DMA4 (0)

/*!@brief DMA base table */
#define EDMA_BASE_PTRS \
    {                  \
        DMA0, DMA1     \
    }

#define EDMA_CHN_IRQS                                                                                               \
    {                                                                                                               \
        {EDMA_0_CH0_IRQn,  EDMA_0_CH1_IRQn,  EDMA_0_CH2_IRQn,  EDMA_0_CH3_IRQn, EDMA_0_CH4_IRQn,  EDMA_0_CH5_IRQn,  \
         EDMA_0_CH6_IRQn,  EDMA_0_CH7_IRQn,  EDMA_0_CH8_IRQn,  EDMA_0_CH9_IRQn, EDMA_0_CH10_IRQn, EDMA_0_CH11_IRQn, \
         EDMA_0_CH12_IRQn, EDMA_0_CH13_IRQn, EDMA_0_CH14_IRQn, EDMA_0_CH15_IRQn},                                   \
        {                                                                                                           \
            EDMA_1_CH0_IRQn, EDMA_1_CH1_IRQn, EDMA_1_CH2_IRQn, EDMA_1_CH3_IRQn, EDMA_1_CH4_IRQn, EDMA_1_CH5_IRQn,   \
                EDMA_1_CH6_IRQn, EDMA_1_CH7_IRQn, EDMA_1_CH8_IRQn, EDMA_1_CH9_IRQn, EDMA_1_CH10_IRQn,               \
                EDMA_1_CH11_IRQn, EDMA_1_CH12_IRQn, EDMA_1_CH13_IRQn, EDMA_1_CH14_IRQn, EDMA_1_CH15_IRQn            \
        }                                                                                                           \
    }
#if 0
/*!@brief dma request source */
typedef enum _dma_request_source
{
    kDmaRequestDisabled                        = 0U,   /**< Disabled*/
    kDmaRequestMuxFlexSpi0Rx                   = 1U,   /**< FlexSPI0 Receive event */
    kDmaRequestMuxFlexSpi0Tx                   = 2U,   /**< FlexSPI0 Transmit event */
    kDmaRequestMuxPinInt0                      = 3U,   /**< PinInt0 */
    kDmaRequestMuxPinInt1                      = 4U,   /**< PinInt1 */
    kDmaRequestMuxPinInt2                      = 5U,   /**< PinInt2 */
    kDmaRequestMuxPinInt3                      = 6U,   /**< PinInt3 */
    kDmaRequestMuxCtimer0M0                    = 7U,   /**< Ctimer0_M0 */
    kDmaRequestMuxCtimer0M1                    = 8U,   /**< Ctimer0_M1 */
    kDmaRequestMuxCtimer1M0                    = 9U,   /**< Ctimer1_M0 */
    kDmaRequestMuxCtimer1M1                    = 10U,  /**< Ctimer1_M1 */
    kDmaRequestMuxCtimer2M0                    = 11U,  /**< Ctimer2_M0 */
    kDmaRequestMuxCtimer2M1                    = 12U,  /**< Ctimer2_M1 */
    kDmaRequestMuxCtimer3M0                    = 13U,  /**< Ctimer3_M0 */
    kDmaRequestMuxCtimer3M1                    = 14U,  /**< Ctimer3_M1 */
    kDmaRequestMuxCtimer4M0                    = 15U,  /**< Ctimer4_M0 */
    kDmaRequestMuxCtimer5M1                    = 16U,  /**< Ctimer4_M1 */
    kDmaRequestMuxWuu0                         = 17U,  /**< Wake up event */
    kDmaRequestMuxMicfil0FifoRequest           = 18U,  /**< MICFIL0 FIFO_request */
    kDmaRequestMuxSct0Dma0                     = 19U,  /**< SCT0 DMA0 */
    kDmaRequestMuxSct0Dma1                     = 20U,  /**< SCT0 DMA1 */
    kDmaRequestMuxAdc0FifoARequest             = 21U,  /**< ADC0 FIFO A request */
    kDmaRequestMuxAdc0FifoBRequest             = 22U,  /**< ADC0 FIFO B request */
    kDmaRequestMuxAdc1FifoARequest             = 23U,  /**< ADC1 FIFO A request */
    kDmaRequestMuxAdc1FifoBRequest             = 24U,  /**< ADC1 FIFO B request */
    kDmaRequestMuxDac0FifoRequest              = 25U,  /**< DAC0 FIFO_request */
    kDmaRequestMuxDac1FifoRequest              = 26U,  /**< DAC1 FIFO_request */
    kDmaRequestMuxDac2FifoRequest              = 27U,  /**< HP DAC0 FIFO_request */
    kDmaRequestMuxHsCmp0DmaRequest             = 28U,  /**< HS CMP0 DMA_request */
    kDmaRequestMuxHsCmp1DmaRequest             = 29U,  /**< HS CMP0 DMA_request */
    kDmaRequestMuxHsCmp2DmaRequest             = 30U,  /**< HS CMP0 DMA_request */
    kDmaRequestMuxEvtg0Out0A                   = 31U,  /**< EVTG0 OUT0A */
    kDmaRequestMuxEvtg0Out0B                   = 32U,  /**< EVTG0 OUT0B */
    kDmaRequestMuxEvtg0Out1A                   = 33U,  /**< EVTG0 OUT1A */
    kDmaRequestMuxEvtg0Out1B                   = 34U,  /**< EVTG0 OUT1B */
    kDmaRequestMuxEvtg0Out2A                   = 35U,  /**< EVTG0 OUT2A */
    kDmaRequestMuxEvtg0Out2B                   = 36U,  /**< EVTG0 OUT2B */
    kDmaRequestMuxEvtg0Out3A                   = 37U,  /**< EVTG0 OUT3A */
    kDmaRequestMuxEvtg0Out3B                   = 38U,  /**< EVTG0 OUT3B */
    kDmaRequestMuxFlexPwm0ReqCapt0             = 39U,  /**< FlexPWM0 Req_capt0 */
    kDmaRequestMuxFlexPwm0ReqCapt1             = 40U,  /**< FlexPWM0 Req_capt1 */
    kDmaRequestMuxFlexPwm0ReqCapt2             = 41U,  /**< FlexPWM0 Req_capt2 */
    kDmaRequestMuxFlexPwm0ReqCapt3             = 42U,  /**< FlexPWM0 Req_capt3 */
    kDmaRequestMuxFlexPwm0ReqVal0              = 43U,  /**< FlexPWM0 Req_val0 */
    kDmaRequestMuxFlexPwm0ReqVal1              = 44U,  /**< FlexPWM0 Req_val1 */
    kDmaRequestMuxFlexPwm0ReqVal2              = 45U,  /**< FlexPWM0 Req_val2 */
    kDmaRequestMuxFlexPwm0ReqVal3              = 46U,  /**< FlexPWM0 Req_val3 */
    kDmaRequestMuxFlexPwm1ReqCapt0             = 47U,  /**< FlexPWM1 Req_capt0 */
    kDmaRequestMuxFlexPwm1ReqCapt1             = 48U,  /**< FlexPWM1 Req_capt1 */
    kDmaRequestMuxFlexPwm1ReqCapt2             = 49U,  /**< FlexPWM1 Req_capt2 */
    kDmaRequestMuxFlexPwm1ReqCapt3             = 50U,  /**< FlexPWM1 Req_capt3 */
    kDmaRequestMuxFlexPwm1ReqVal0              = 51U,  /**< FlexPWM1 Req_val0 */
    kDmaRequestMuxFlexPwm1ReqVal1              = 52U,  /**< FlexPWM1 Req_val1 */
    kDmaRequestMuxFlexPwm1ReqVal2              = 53U,  /**< FlexPWM1 Req_val2 */
    kDmaRequestMuxFlexPwm1ReqVal3              = 54U,  /**< FlexPWM1 Req_val3 */
    kDmaRequestMuxItrc0TmprOut0                = 55U,  /**< ITRC0 TMPR_OUT0 */
    kDmaRequestMuxItrc0TmprOut1                = 56U,  /**< ITRC0 TMPR_OUT1 */
    kDmaRequestMuxLptmr0                       = 57U,  /**< LPTMR0 Counter match event */
    kDmaRequestMuxLptmr1                       = 58U,  /**< LPTMR1 Counter match event */
    kDmaRequestMuxFlexCan0DmaRequest           = 59U,  /**< FlexCAN0 DMA request */
    kDmaRequestMuxFlexCan1DmaRequest           = 60U,  /**< FlexCAN1 DMA request */
    kDmaRequestMuxFlexIO0ShiftRegister0Request = 61U,  /**< FlexIO0 Shift Register 0 request */
    kDmaRequestMuxFlexIO0ShiftRegister1Request = 62U,  /**< FlexIO0 Shift Register 1 request */
    kDmaRequestMuxFlexIO0ShiftRegister2Request = 63U,  /**< FlexIO0 Shift Register 2 request */
    kDmaRequestMuxFlexIO0ShiftRegister3Request = 64U,  /**< FlexIO0 Shift Register 3 request */
    kDmaRequestMuxFlexIO0ShiftRegister4Request = 65U,  /**< FlexIO0 Shift Register 4 request */
    kDmaRequestMuxFlexIO0ShiftRegister5Request = 66U,  /**< FlexIO0 Shift Register 5 request */
    kDmaRequestMuxFlexIO0ShiftRegister6Request = 67U,  /**< FlexIO0 Shift Register 6 request */
    kDmaRequestMuxFlexIO0ShiftRegister7Request = 68U,  /**< FlexIO0 Shift Register 7 request */
    kDmaRequestMuxLpFlexcomm0Rx                = 69U,  /**< LP_FLEXCOMM0 Receive request */
    kDmaRequestMuxLpFlexcomm0Tx                = 70U,  /**< LP_FLEXCOMM0 Transmit request */
    kDmaRequestMuxLpFlexcomm1Rx                = 71U,  /**< LP_FLEXCOMM1 Receive request */
    kDmaRequestMuxLpFlexcomm1Tx                = 72U,  /**< LP_FLEXCOMM1 Transmit request */
    kDmaRequestMuxLpFlexcomm2Rx                = 73U,  /**< LP_FLEXCOMM2 Receive request */
    kDmaRequestMuxLpFlexcomm2Tx                = 74U,  /**< LP_FLEXCOMM2 Transmit request */
    kDmaRequestMuxLpFlexcomm3Rx                = 75U,  /**< LP_FLEXCOMM3 Receive request */
    kDmaRequestMuxLpFlexcomm3Tx                = 76U,  /**< LP_FLEXCOMM3 Transmit request */
    kDmaRequestMuxLpFlexcomm4Rx                = 77U,  /**< LP_FLEXCOMM4 Receive request */
    kDmaRequestMuxLpFlexcomm4Tx                = 78U,  /**< LP_FLEXCOMM4 Transmit request */
    kDmaRequestMuxLpFlexcomm5Rx                = 79U,  /**< LP_FLEXCOMM5 Receive request */
    kDmaRequestMuxLpFlexcomm5Tx                = 80U,  /**< LP_FLEXCOMM5 Transmit request */
    kDmaRequestMuxLpFlexcomm6Rx                = 81U,  /**< LP_FLEXCOMM6 Receive request */
    kDmaRequestMuxLpFlexcomm6Tx                = 82U,  /**< LP_FLEXCOMM6 Transmit request */
    kDmaRequestMuxLpFlexcomm7Rx                = 83U,  /**< LP_FLEXCOMM7 Receive request */
    kDmaRequestMuxLpFlexcomm7Tx                = 84U,  /**< LP_FLEXCOMM7 Transmit request */
    kDmaRequestMuxLpFlexcomm8Rx                = 85U,  /**< LP_FLEXCOMM8 Receive request */
    kDmaRequestMuxLpFlexcomm8Tx                = 86U,  /**< LP_FLEXCOMM8 Transmit request */
    kDmaRequestMuxLpFlexcomm9Rx                = 87U,  /**< LP_FLEXCOMM9 Receive request */
    kDmaRequestMuxLpFlexcomm9Tx                = 88U,  /**< LP_FLEXCOMM9 Transmit request */
    kDmaRequestMuxESpi0Ch0                     = 89U,  /**< eSPI0 channel 0 */
    kDmaRequestMuxESpi0Ch1                     = 90U,  /**< eSPI0 channel 1 */
    kDmaRequestMuxEmvSim0Rx                    = 91U,  /**< EMVSIM0 Receive request */
    kDmaRequestMuxEmvSim0Tx                    = 92U,  /**< EMVSIM0 Transmit request */
    kDmaRequestMuxEmvSim1Rx                    = 93U,  /**< EMVSIM1 Receive request */
    kDmaRequestMuxEmvSim1Tx                    = 94U,  /**< EMVSIM1 Transmit request */
    kDmaRequestMuxI3c0Rx                       = 95U,  /**< I3C0 Receive request */
    kDmaRequestMuxI3c0Tx                       = 96U,  /**< I3C0 Transmit request */
    kDmaRequestMuxI3c1Rx                       = 97U,  /**< I3C0 Receive request */
    kDmaRequestMuxI3c1Tx                       = 98U,  /**< I3C0 Transmit request */
    kDmaRequestMuxSai0Rx                       = 99U,  /**< SAI0 Receive request */
    kDmaRequestMuxSai0Tx                       = 100U, /**< SAI0 Receive request */
    kDmaRequestMuxSai1Rx                       = 101U, /**< SAI1 Receive request */
    kDmaRequestMuxSai1Tx                       = 102U, /**< SAI1 Receive request */
    kDmaRequestMuxSinc0IpdReqSincAlt0          = 103U, /**< SINC0 ipd_req_sinc[0] or ipd_req_alt [0] */
    kDmaRequestMuxSinc0IpdReqSincAlt1          = 104U, /**< SINC0 ipd_req_sinc[1] or ipd_req_alt [1] */
    kDmaRequestMuxSinc0IpdReqSincAlt2          = 105U, /**< SINC0 ipd_req_sinc[2] or ipd_req_alt [2] */
    kDmaRequestMuxSinc0IpdReqSincAlt3          = 106U, /**< SINC0 ipd_req_sinc[3] or ipd_req_alt [3] */
    kDmaRequestMuxSinc0IpdReqSincAlt4          = 107U, /**< SINC0 ipd_req_sinc[4] or ipd_req_alt [4] */
    kDmaRequestMuxGpio0PinEventRequest0        = 108U, /**< GPIO0 Pin event request 0 */
    kDmaRequestMuxGpio0PinEventRequest1        = 109U, /**< GPIO0 Pin event request 1 */
    kDmaRequestMuxGpio1PinEventRequest0        = 110U, /**< GPIO1 Pin event request 0 */
    kDmaRequestMuxGpio1PinEventRequest1        = 111U, /**< GPIO1 Pin event request 1 */
    kDmaRequestMuxGpio2PinEventRequest0        = 112U, /**< GPIO2 Pin event request 0 */
    kDmaRequestMuxGpio2PinEventRequest1        = 113U, /**< GPIO2 Pin event request 1 */
    kDmaRequestMuxGpio3PinEventRequest0        = 114U, /**< GPIO3 Pin event request 0 */
    kDmaRequestMuxGpio3PinEventRequest1        = 115U, /**< GPIO3 Pin event request 1 */
    kDmaRequestMuxGpio4PinEventRequest0        = 116U, /**< GPIO4 Pin event request 0 */
    kDmaRequestMuxGpio4PinEventRequest1        = 117U, /**< GPIO4 Pin event request 1 */
    kDmaRequestMuxGpio5PinEventRequest0        = 118U, /**< GPIO5 Pin event request 0 */
    kDmaRequestMuxGpio5PinEventRequest1        = 119U, /**< GPIO5 Pin event request 1 */
    kDmaRequestMuxTsi0EndOfScan                = 120U, /**< TSI0 End of Scan */
    kDmaRequestMuxTsi0OutOfRange               = 121U, /**< TSI0 Out of Range */
} dma_request_source_t;
#endif
//#define FSL_FEATURE_EDMA_MODULE_CHANNEL(base)                (16U)
#define FSL_FEATURE_EDMA_MODULE_MAX_CHANNEL                  (16)
#define FSL_FEATURE_EDMA_HAS_GLOBAL_MASTER_ID_REPLICATION    (1)
#define FSL_FEATURE_EDMA_HAS_CONTINUOUS_LINK_MODE            (0)
#define FSL_FEATURE_EDMA_MODULE_COUNT                        (2)
#define FSL_FEATURE_EDMA_HAS_CHANNEL_CONFIG                  (1)
#define FSL_FEATURE_EDMA_HAS_CHANNEL_SWAP_SIZE               (0)
#define FSL_FEATURE_EDMA_HAS_CHANNEL_ACCESS_TYPE             (0)
#define FSL_FEATURE_EDMA_HAS_CHANNEL_MEMRORY_ATTRIBUTE       (0)
#define FSL_FEATURE_EDMA_HAS_CHANNEL_SIGN_EXTENSION          (0)
#define FSL_FEATURE_EDMA_MODULE_SUPPORT_MATTR(base)          (0U)
#define FSL_FEATURE_EDMA_MODULE_SUPPORT_SIGN_EXTENSION(base) (0U)
#define FSL_FEATURE_EDMA_MODULE_SUPPORT_SWAP(base)           (0U)
#define FSL_FEATURE_EDMA_MODULE_SUPPORT_INSTR(base)          (0U)

/*!@brief EDMA base address convert macro */
#define EDMA_CHANNEL_OFFSET           0x1000U
#define EDMA_CHANNEL_ARRAY_STEP(base) (0x1000U)

/*******************************************************************************
 * API
 ******************************************************************************/

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __cplusplus
}
#endif

/*!
 * @}
 */

#endif /* _FSL_EDMA_SOC_H_ */
