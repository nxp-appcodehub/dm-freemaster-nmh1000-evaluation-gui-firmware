Example Brief:
===================
This example demonstrates combining ISSDK and FreeMASTER to create NMH1000 magnetic switch sensor GUI
for our customer to evaluate this sensor using sensor development tools with sensors expansion boards.

Hardware requirements
=====================
- Mini/micro C USB cable
- FRDM-MCXA153 board
- hall Switch 3 Click
- FreeMASTER 3.2.2.2

Board settings
============
Connect hall Switch 3 Click MikroE click board to FRDM-MCXA153 MCU on MikroBUS header.

Prepare the demo
===============
1.  Connect a USB cable between the host PC and the Debug USB port on the target board.
2.  Compile and download the program to the target microcontroller.
3.  Run and resume application execution when debugger stops in the main() function.

Connect with FreeMASTER
=======================
4.  Launch FreeMASTER application installed on your Windows PC.
5.  Click on "Connection Wizard" and select Next>.
6.  Select "Use direct connection to on board USB port" and click Next>.
7.  The FreeMASTER tool detects the COM port (Select the identified COM port on next screen) with the configured baud-rate automatically. Confirm the COM port and baud-rate, click �Next>�.
8.  FreeMASTER detects the board connection and will ask to confirm the detected settings. Confirm by selecting �Yes� and click �Finish�.
9.  FreeMASTER opens an option to "Open an Existing Project". Select the option.
10. Browse to "<dm-freemaster-nmh1000-evaluation-gui-firmware\nmh1000_evaluation_gui\freemaster_gui/sensors/nmh1000" folder.
11. Select "NMH1000_Magnetic_Switch_Demo.pmpx" sensor demo project. Click "Open".
12. FreeMASTER launches the NMH1000 sensor demo. Click on "Magnetic Data Streaming" to visualize the current magnetic strenght reading and magnetic event status. Apply a magnetic field greater than threshold value and check whether Mag event is raised.
13. Click "NMH1000 Register Page" tab to access the NMH1000 register set. Click "Read All" to view instantaneous values of the NMH1000 sensor registers in real time.
14. Users can select specific registers and perform single register read or write actions in real time. For a chosen sensor register with read/write access, users can toggle bitfields to change the register value and click "Write" to perform register write operation and/or perform register read by clicking "Read".


More information
================
Read more information about FreeMASTER Sensor tool at:
https://www.nxp.com/design/design-center/software/sensor-toolbox/freemaster-sensor-tool-for-iot-industrial-medical-sensors:FREEMASTER-SENSOR-TOOL
Feel free to ask questions and report issues at FreeMASTER's 
community page at https://community.nxp.com/community/freemaster
