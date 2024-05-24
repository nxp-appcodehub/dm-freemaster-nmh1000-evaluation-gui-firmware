/*******************************************************************************
*
* NXP Confidential Proprietary
*
* Copyright 2018-2019 NXP
* All Rights Reserved
*
* @file           fmng-client.js
*
 *******************************************************************************
*
* THIS SOFTWARE IS PROVIDED BY NXP "AS IS" AND ANY EXPRESSED OR
* IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
* OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
* IN NO EVENT SHALL NXP OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
* INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
* (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
* HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
* STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
* IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
* THE POSSIBILITY OF SUCH DAMAGE.
*
 ******************************************************************************/

/**
 * @typedef {Object} FML_Response
 *
 * FreeMASTER Lite service response format
 *
 * @property {string} status  Response status "OK" or "FAIL"
 * @property {Object} [data]  Response data (if status == "OK"), depends on the function
 * @property {Object} [error] Response error (if status == "FAIL")
 * @property {number} error.code    Response error code
 * @property {string} error.message Response error message
 */

/**
 * @typedef {Object} CommPortInfo
 *
 * Communication port information.
 *
 * @property {string} name             Communication port friendly name
 * @property {string} description      Communication port description
 * @property {string} connectionString Connection string
 * @property {string} elf              Elf file path
 */

/**
 * @typedef {Object} BoardInfo
 *
 * Detected board information.
 *
 * @property {number} protVer      Protocol version
 * @property {number} cfgFlags     Configuration flags
 * @property {number} dataBusWdt   Data bus width
 * @property {number} globVerMajor Major version
 * @property {number} globVerMinor Minor version
 * @property {number} cmdBuffSize  Command buffer size
 * @property {number} recBuffSize  Receive buffer size
 * @property {number} recTimeBase  Recirder time base
 * @property {string} descr        Description
 */

/**
 * @typedef {Object} SymbolInfo
 *
 * Symbol information.
 *
 * @property {string} name Symbol name
 * @property {number} addr Symbol address
 * @property {number} size Symbol size
 * @property {string} type Symbol type
 */

/**
 * @typedef {Object} VariableInfo
 *
 * Variable information.
 *
 * @property {string} name    Variable name
 * @property {number} addr    Variable address
 * @property {string} type    Variable type (int, uint, fract, ufract, float, or double)
 * @property {number} size    Variable size (1, 2, 4, or 8)
 * @property {number} [shift] Number of shift positions (integers variables)
 * @property {number} [mask]  And mask applied on the integers variable
 * @property {number} q_n     Number of bits desinating fractional portion of the fractional variable
 * @property {number} q_m     Number of bits desinating integer portion of the fractional variables
 */

/**
 * @typedef {Object} RecorderLimits
 *
 * Recorder limits.
 *
 * @property {number} baseRate_ns   Base time at which recorder operates in nanoseconds (0 when unknown or not deterministic)
 * @property {number} buffSize      Total recorder memory size
 * @property {number} recStructSize Overhead structure size (protcol version > 4.0)
 * @property {number} varStructSize Per-variable overhead structure size (protcol version > 4.0)
 */

/**
 * @typedef {Object} RecorderConfig
 *
 * Recorder configuration.
 *
 * @property {number} pointsTotal      Total number of recorded points per variable
 * @property {number} pointsPreTrigger Number of recorded points before trigger
 * @property {number} timeDiv          Time-base multiplier
 */

/**
 * @typedef {Object} TriggerVariable
 *
 * Recorder variable information.
 *
 * @property {string} name    Variable name
 * @property {number} trgType Trigger type
 * 
 * | Mask | Description                            |
 * | :--- | :--------------------------------------|
 * | 0x04 | trigger-only                           |
 * | 0x10 | trigger on rising edge _/              |
 * | 0x20 | trigger on falling edge \_             |
 * | 0x40 | 0=normal edge trigger, 1=level trigger |
 * | 0x80 | use variable threshold                 |
 * @property {number} trgThr Trigger trashold
 */

 (function (root) {
    'use strict';

    if (typeof require !== 'undefined') {
        root.simple_jsonrpc = require('./simple-jsonrpc-js');
        root.WebSocket = require('ws');
    }

    /**
     * @class
     * @classdesc PCM is an adpter class for FreeMASTER Lite API that handles the websocket connections to the service and command conversion to JSON-RPC format. It runs both on front-end (web browsers) and back-end (NodeJS).
     * @description Creates an instance of PCM object.
     *
     * @example
     * // Create a PCM instance
     * function main() {
     *     // main logic of the application
     * };
     * $(document).ready(function() {
     *     var pcm = new PCM(window.location.host, main);
     * });
     *
     * @example
     * // Handle API calls using {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise Promises}
     * pcm.PCM_Function(params)
     *     .then(result => {
     *         // check result tatus & process the data 
     *     })
     *     .catch(err => {
     *         // an error occured while resolving the promise
     *     });
     *
     * @example
     * // Handle API calls as {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await async functions}
     * try {
     *     let result = await pcm.PCM_Function(params);
     *     // check result tatus & process the data
     * } catch (err) {
     *     // an error occured while resolving the promise
     * }
     *
     * @param {string}   url             The address of the web server.
     * @param {Function} on_socket_open  WebSocket open event handler.
     * @param {Function} on_socket_close WebSocket close event handler.
     * @param {Function} on_socket_error WebSocket error event handler.
     */
    var PCM = function(url, on_socket_open, on_socket_close, on_socket_error) {

        var jrpc = new root.simple_jsonrpc();
        var socket = new root.WebSocket("ws://" + url);

        jrpc.toStream = function(_msg) {
            socket.send(_msg);
        };
        socket.onopen = function(event) {
            if (on_socket_open) {
                on_socket_open(event);
            } else {
                console.log("WebSocket is open.");
            }
        };
        socket.onclose = function(event) {
            if (on_socket_close) {
                on_socket_close(event);
            } else {
                console.log("WebSocket error.");
            }
        };
        socket.onerror = function(event) {
            if (on_socket_error) {
                on_socket_error(event);
            } else {
                console.log("Connection closed.");
            }
        };
        socket.onmessage = function(event) {
            jrpc.messageHandler(event.data);
        };

        /**
         * Requests Freemaster Lite service version.
         *
         * @example
         * let result = await pcm.GetAppVersion();
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type string representing the version.
         */
        this.GetAppVersion = function() {
            return jrpc.call('GetAppVersion');
        };

        /**
         * Requests communication port name (defined in project file) by index.
         * @see {@link PCM#GetCommPortInfo GetCommPortInfo}
         *
         * @example
         * let index = 0;
         * do {
         *     let result = await pcm.EnumCommPorts(index);
         *     if (result.status === "FAIL") break;
         *     console.log(result.data);
         *     index = index + 1;
         * } while (true);
         *
         * @param   {number} index Communication port index.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type string representing the connection friendly name.
         */
        this.EnumCommPorts = function(index) {
            return jrpc.call('EnumCommPorts', [index]);
        };

        /**
         * Requests communication port information (defined in project file).
         * @see {@link PCM#EnumCommPorts EnumCommPorts}
         *
         * @example
         * let result = await pcm.EnumCommPorts(0);
         * if (result.status === "OK") {
         *     result = await pcm.GetCommPortInfo(result.data);
         *     if (result.status === "OK") {
         *         console.log(result.data);
         *     }
         * }
         *
         * @param   {string} name Communiation port friendly name returned by {@link PCM#EnumCommPorts EnumCommPorts}
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type {@link CommPortInfo CommPortInfo}.
         */
        this.GetCommPortInfo = function(name) {
            return jrpc.call('GetCommPortInfo', [name]);
        };

        /**
         * Requests configuration parameter of type uint8.
         *
         * @example
         * let result = await pcm.GetConfigParamU8("F1");
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {string} name Parameter name
         *
         * | Name | Description                                   |
         * | :--- | :---------------------------------------------|
         * | F1   | Flags                                         |
         * | RC   | Number of recorders implemented on target     |
         * | SC   | Number of oscilloscopes implemented on target |
         * | PC   | Number of pipes implemented on target         |
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing parameter value.
         */
        this.GetConfigParamU8 = function(name) {
            return jrpc.call('GetConfigParamU8', [name]);
        };

        /**
         * Requests confiugration parameter encoded as ULEB128.
         *
         * @example
         * let result = await pcm.GetConfigParamULEB("MTU");
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         * 
         * @param   {string} name Parameter name
         *
         * | Name | Description                                                                       |
         * | :--- | :-------------------------------------------------------------------------------- |
         * | MTU  | Size of an internal communication buffer for handling command and response frames |
         * | BA   | Base address used by optimized memory read/write commands                         |
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing parameter value.
         */
        this.GetConfigParamULEB = function(name) {
            return jrpc.call('GetConfigParamULEB', [name]);
        };

        /**
         * Requests confiugration parameter of type string.
         *
         * | Name | Description             |
         * | :--- | :-----------------------|
         * | VS   | Version string          |
         * | NM   | Application name string |
         * | DS   | Description string      |
         * | BD   | Build date/time string  |
         *
         * @example
         * let result = await pcm.GetConfigParamString("VS", 10);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {string} name  Parameter name
         * @param   {number} [len] String byte length, if missing will be set to the service max buffer size (256)
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type string representing parameter value.
         */
        this.GetConfigParamString = function(name, len) {
            return jrpc.call('GetConfigParamString', [name, len]);
        };

        /**
         * Requests detected board information.
         *
         * @example
         * let result = await pcm.GetDetectedBoardInfo();
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @deprecated Since protocol version 4.0
         *
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type {@link BoardInfo BoardInfo} representing board information.
         */
        this.GetDetectedBoardInfo = function() {
            return jrpc.call('GetDetectedBoardInfo');
        };

        /**
         * Checks if the board was detected.
         *
         * @example
         * let result = await pcm.IsBoardDetected();
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type bool.
         */
        this.IsBoardDetected = function() {
            return jrpc.call('IsBoardDetected');
        };

        /**
         * Checks if communication port is open.
         *
         * @example
         * let result = await pcm.IsCommPortOpen();
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type bool.
         */
        this.IsCommPortOpen = function() {
            return jrpc.call('IsCommPortOpen');
        };

        /**
         * Starts communication using connection friendly name.
         *
         * @example
         * let result = await pcm.StartComm(name);
         * if (result.status === "OK") {
         *     console.log("Communication port open.");
         * }
         *
         * @param   {string} name Connection friendly name (defined in project file).
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.StartComm = function(name, connStr) {
            return jrpc.call('StartComm', [name, connStr]);
        };

        /**
         * Stops communication.
         *
         * @example
         * let result = await pcm.StopComm();
         * if (result.status === "OK") {
         *     console.log("Communicayion port closed.");
         * }
         *
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.StopComm = function() {
            return jrpc.call('StopComm');
        };

        /**
         * Reads an array of signed integers from a memory location.
         *
         * @example
         * // read 20, 2 byte long, signed integers from address 0x20050080
         * let result = await pcm.ReadUIntArray(0x20050080, 20, 2);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Number of elements.
         * @param   {number}        elSize Element size, can be 1, 2, 4, or 8.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type Array<number>.
         */
        this.ReadIntArray = function(addr, size, elSize) {
            return jrpc.call('ReadIntArray', [addr, size, elSize]);
        };

        /**
         * Reads an array of unsigned integers from a memory location.
         *
         * @example
         * // read 10, 4 byte long, unsigned integers from the address given by the symbol 'arr16'
         * let result = await pcm.ReadIntArray('arr16', 10, 4);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Number of elements.
         * @param   {number}        elSize Element size, can be 1, 2, 4, or 8.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type Array<number>.
         */
        this.ReadUIntArray = function(addr, size, elSize) {
            return jrpc.call('ReadUIntArray', [addr, size, elSize]);
        };

        /**
         * Reads an array of floats from a memory location.
         *
         * @example
         * // read 5 floats from the address given by the symbol 'arrFLT'
         * let result = await pcm.ReadFloatArray('arrFLT', 5);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Number of elements.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type Array<number>.
         */
        this.ReadFloatArray = function(addr, size) {
            return jrpc.call('ReadFloatArray', [addr, size]);
        };

        /**
         * Reads an array of doubles from a memory location.
         *
         * @example
         * // read 5 doubles from the address given by the symbol 'arrDBL'
         * let result = await pcm.ReadDoubleArray('arrDBL', 5);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Number of elements.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type Array<number>.
         */
        this.ReadDoubleArray = function(addr, size) {
            return jrpc.call('ReadDoubleArray', [addr, size]);
        };

        /**
         * Writes an array of signed integers to a memory location.
         *
         * @example
         * let result = await pcm.WriteIntArray(0x20050080, 2, [1, 2, 3, 4, 5]);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        elSize Element size, can be 1, 2, 4, or 8.
         * @param   {Array<number>} data   Array of integers to be written.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen array elements.
         */
        this.WriteIntArray = function(addr, elSize, data) {
            return jrpc.call('WriteIntArray', [addr, elSize, data]);
        };

        /**
         * Writes an array of unsigned integers to a memory location.
         *
         * @example
         * let result = await pcm.WriteUIntArray('arr16', 4, [100, 1000, 10000, 100000, 1000000]);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        elSize Element size, can be 1, 2, 4, or 8.
         * @param   {Array<number>} data   Array of integers to be written.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen array elements.
         */
        this.WriteUIntArray = function(addr, elSize, data) {
            return jrpc.call('WriteUIntArray', [addr, elSize, data]);
        };

        /**
         * Writes an array of floats to a memory location.
         *
         * @example
         * let result = await pcm.ReadFloatArray('arrFLT', [1.0, 2.0, 3.0, 4.0, 5.0]);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        data   Array of floats to be written.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen array elements.
         */
        this.WriteFloatArray = function(addr, data) {
            return jrpc.call('WriteFloatArray', [addr, data]);
        };

        /**
         * Writes an array of doubles to a memory location.
         *
         * @example
         * let result = await pcm.WriteDoubleArray('arrDBL', [1.0, 2.0, 3.0, 4.0, 5.0]);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Array of doubles to be written.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen array elements.
         */
        this.WriteDoubleArray = function(addr, data) {
            return jrpc.call('WriteDoubleArray', [addr, data]);
        };

        /**
         * Reads a signed integer value from a memory location.
         *
         * @example
         * let result = await pcm.ReadIntVariable(0x20050080, 2);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Integer size, can be 1, 2, 4, or 8.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the read value.
         */
        this.ReadIntVariable = function(addr, size) {
            return jrpc.call('ReadIntVariable', [addr, size]);
        };

        /**
         * Reads an unsigned integer value from a memory location.
         *
         * @example
         * let result = await pcm.ReadUIntVariable('var16', 4);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Integer size, can be 1, 2, 4, or 8.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the read value.
         */
        this.ReadUIntVariable = function(addr, size) {
            return jrpc.call('ReadUIntVariable', [addr, size]);
        };

        /**
         * Reads a float value from a memory location.
         *
         * @example
         * let result = await pcm.ReadFloatVariable('varFLT');
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the read value.
         */
        this.ReadFloatVariable = function(addr) {
            return jrpc.call('ReadFloatVariable', [addr]);
        };

        /**
         * Reads a double value from a memory location.
         *
         * @example
         * let result = await pcm.ReadDoubleVariable('varDBL');
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the read value.
         */
        this.ReadDoubleVariable = function(addr) {
            return jrpc.call('ReadDoubleVariable', [addr]);
        };

        /**
         * Writes a signed integer value to a memory location.
         *
         * @example
         * let result = await pcm.WriteIntVariable(0x20050080, 2, 10);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Integer size, can be 1, 2, 4, or 8.
         * @param   {Array<number>} data   Integer value to be written.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.WriteIntVariable = function(addr, size, data) {
            return jrpc.call('WriteIntVariable', [addr, size, data]);
        };

        /**
         * Writes an unsigned integer value to a memory location.
         *
         * @example
         * let result = await pcm.WriteUIntVariable("var16", 2, 100);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {number}        size   Integer size, can be 1, 2, 4, or 8.
         * @param   {Array<number>} data   Integer value to be written.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.WriteUIntVariable = function(addr, size, data) {
            return jrpc.call('WriteUIntVariable', [addr, size, data]);
        };

        /**
         * Writes a float value to a memory location.
         *
         * @example
         * let result = await pcm.WriteFloatVariable("varFLT", 10.0);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr Address value or symbol name.
         * @param   {Array<number>} data Float value to be written.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.WriteFloatVariable = function(addr, data) {
            return jrpc.call('WriteFloatVariable', [addr, data]);
        };

        /**
         * Writes a double value to a memory location.
         *
         * @example
         * let result = await pcm.WriteDoubleVariable("varDBL", 100.0);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number|string} addr   Address value or symbol name.
         * @param   {Array<number>} data   Double value to be written.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.WriteDoubleVariable = function(addr, data) {
            return jrpc.call('WriteDoubleVariable', [addr, data]);
        };

        /**
         * Sends the command to read symbols from the elf file associated with the current connection (defined in project file).
         * @see {@link PCM#EnumSymbols EnumSymbols}
         * 
         * @example
         * let result = await pcm.ReadELF();
         * if (result.status === "OK") {
         *     console.log("ELF file parsed.");
         * }
         *
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.ReadELF = function(elfFile) {
            return jrpc.call('ReadELF', [elfFile]);
        };

        /**
         * Sends the command to read read symbols from the TSA table from the connected target.
         * @see {@link PCM#EnumSymbols EnumSymbols}
         * 
         * @example
         * let result = await pcm.ReadTSA();
         * if (result.status === "OK") {
         *     console.log("TSA table parsed.");
         * }
         *
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.ReadTSA = function() {
            return jrpc.call('ReadTSA');
        };

        /**
         * Requests symbol (extracted from ELF file or TSA table) name by index.
         * @see {@link PCM#ReadELF ReadELF}
         * @see {@link PCM#ReadTSA ReadTSA}
         * @see {@link PCM#GetSymbolInfo GetSymbolInfo}
         *
         * @example
         * let index = 0;
         * do {
         *     let result = await pcm.EnumSymbols(index);
         *     if (result.status === "FAIL") break;
         *     console.log(result.data);
         *     index = index + 1;
         * } while (true);
         *
         * @param   {number} index Symbol index.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type string representing the symbol name.
         */
        this.EnumSymbols = function(index) {
            return jrpc.call('EnumSymbols', [index]);
        };

        /**
         * Requests symbol information.
         * @see {@link PCM#EnumSymbols EnumSymbols}
         *
         * @example
         * let result = await pcm.EnumSymbols(0);
         * if (result.status === "OK") {
         *     result = await pcm.GetSymbolInfo(result.data);
         *     if (result.status === "OK") {
         *         console.log(result.data);
         *     }
         * }
         *
         * @param   {string} name Symbol name returned by {@link PCM#EnumSymbols EnumSymbols}
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type {@link SymbolInfo SymbolInfo}.
         */
        this.GetSymbolInfo = function(name) {
            return jrpc.call('GetSymbolInfo', [name]);
        };

        /**
         * Defines a variable.
         *
         * @example
         * let variable = { name: "var16", address: 0x20050080, type: "uint", size: 4 }
         * let result = await pcm.DefineVariable(variable);
         * if (result.status === "OK") {
         *     console.log("Variable successfully defined.");
         * }
         *
         * @param   {VariableInfo} variable Variable information
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.DefineVariable = function(variable) {
            return jrpc.call('DefineVariable', [variable]);
        };

        /**
         * Requests variable name by index.
         * @see {@link PCM#DefineVariable DefineVariable}
         * @see {@link PCM#GetVariableInfo GetVariableInfo}
         *
         * @example
         * let index = 0;
         * do {
         *     let result = await pcm.EnumVariables(index);
         *     if (result.status === "FAIL") break;
         *     console.log(result.data);
         *     index = index + 1;
         * } while (true);
         *
         * @param   {number} index Variable index.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type string representing the variable name.
         */
        this.EnumVariables = function(index) {
            return jrpc.call('EnumVariables', [index]);
        };

        /**
         * Requests variable information.
         * @see {@link PCM#DefineVariable DefineVariable}
         *
         * @example
         * let result = await pcm.EnumVariables(0);
         * if (result.status === "OK") {
         *     result = await pcm.GetVariableInfo(result.data);
         *     if (result.status === "OK") {
         *         console.log(result.data);
         *     }
         * }
         *
         * @param   {string} name Variable name.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type {@link VariableInfo VariableInfo}.
         */
        this.GetVariableInfo = function(name) {
            return jrpc.call('GetVariableInfo', [name]);
        };

        /**
         * Deletes all user defined variables (except those defined in project file).
         *
         * @example
         * let result = await pcm.DeleteAllScriptVariables();
         * if (result.status === "OK") {
         *     console.log("Script variales deleted.");
         * }
         *
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.DeleteAllScriptVariables = function() {
            return jrpc.call('DeleteAllScriptVariables');
        };

        /**
         * Reads variable value according to the predefined variable information.
         * @see {@link PCM#DefineVariable DefineVariable}
         *
         * @example
         * let result = await pcm.ReadVariable("var16");
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {string} name Variable name.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing variable value.
         */
        this.ReadVariable = function(name) {
            return jrpc.call('ReadVariable', [name]);
        };

        /**
         * Writes a variable value according to the predefined variable information.
         * @see {@link PCM#DefineVariable DefineVariable}
         *
         * @example
         * let result = await pcm.WriteVariable("var16", 255);
         * if (result.status === "OK") {
         *     console.log("Value successfully written.");
         * }
         *
         * @param   {string} name Variable name.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.WriteVariable = function(name, value) {
            return jrpc.call('WriteVariable', [name, value]);
        };

        /**
         * Defines a scope with a specific ID.
         *
         * Notes:
         * * Scope ID should be in the target supported range (defined in the embedded application).
         * * All the variables should be defiend prior to scope definition.
         * * Older protocol version (< 4.0) support only one scope instance.
         *
         * @see {@link PCM#GetScopeData GetScopeData}
         *
         * @example
         * let id = 0;
         * let vars = ['myVAr1', 'myVar2', 'myVar3'];
         * let result = await pcm.DefineScope(id, vars);
         * if (result.status === "OK") {
         *     console.log("Scope was setup successfully.");
         * }
         *
         * @param   {number}        id   Scope ID.
         * @param   {Array<string>} vars Scope variables names.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.DefineScope = function(id, vars) {
            return jrpc.call('DefineScope', [id, vars]);
        };

        /**
         * Requests scope data.
         *
         * The values will be returned in the format defined by each variable.
         *
         * @see {@link PCM#DefineScope DefineScope}
         *
         * @example
         * let id = 0;
         * let vars = ['myVAr1', 'myVar2', 'myVar3'];
         * let result = await pcm.DefineScope(id, vars);
         * if (result.status === "OK") {
         *     result = await pcm.GetScopeData(id);
         * }
         *
         * @param   {number} id Scope ID.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type array of numbers (variables corresponding values in the defined order).
         */
        this.GetScopeData = function(id) {
            return jrpc.call('GetScopeData', [id]);
        };

        /**
         * Requests recorder limits.
         *
         * @example
         * let id = 0;
         * let result = await pcm.GetRecorderLimits(id);
         * if (result.status === "OK") {
         *     console.log("Recorder was setup successfully.");
         * }
         *
         * @param   {number} id Recorder ID.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type {@link RecorderLimits RecorderLimits}.
         */
        this.GetRecorderLimits = function(id) {
            return jrpc.call('GetRecorderLimits', [id]);
        };

        /**
         * Defines a recorder with a specific ID.
         *
         * Notes:
         * * Recorder ID should be in the target supported range (defined in the embedded application).
         * * All the variables should be defiend prior to recorder definitions.
         * * Older protocol version (< 4.0) support only one recorder instance.
         *
         * @example
         * let id = 0;
         * let config = {
         *     pointsTotal: 100,
         *     pointsPreTrigger: 50,
         *     timeDiv: 1
         * };
         * let recVars = ['myVAr1', 'myVar2', 'myVar3'];
         * let trgVars = [{ name: 'myVar2', trgType: 0x11, trgThr: 2000 }];
         * let result = await pcm.DefineRecorder(id, config, recVars, trgVars);
         * if (result.status === "OK") {
         *     console.log("Recorder was setup successfully.");
         * }
         *
         * @param   {number}                 id      Recorder ID.
         * @param   {RecorderConfig}         config  Recorder configuartion.
         * @param   {Array<string>}          recVars Recorded variables.
         * @param   {Array<TriggerVariable>} trgVars Trigger variables.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.DefineRecorder = function(id, config, recVars, trgVars) {
            return jrpc.call('DefineRecorder', [id, config, recVars, trgVars]);
        };

        /**
         * Starts a recorder.
         * @see {@link PCM#DefineRecorder DefineRecorder}
         *
         * @example
         * let result = await pcm.StartRecorder(id);
         * if (result.status === "OK") {
         *     console.log("Recorder started");
         * }
         *
         * @param   {number} id Recorder ID.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.StartRecorder = function(id) {
            return jrpc.call('StartRecorder', [id]);
        };

        /**
         * Stops a recorder.
         * @see {@link PCM#DefineRecorder DefineRecorder}
         * @see {@link PCM#StartRecorder StartRecorder}
         *
         * @example
         * let result = await pcm.StopRecorder(id);
         * if (result.status === "OK") {
         *     console.log("Recorder stoped");
         * }
         *
         * @param   {number} id Recorder ID.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.StopRecorder = function(id) {
            return jrpc.call('StopRecorder', [id]);
        };

        /**
         * Requests recorder status.
         * @see {@link PCM#DefineRecorder DefineRecorder}
         * @see {@link PCM#StartRecorder StartRecorder}
         *
         * @example
         * let result = await pcm.GetRecorderStatus(id);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number} id Recorder ID.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number.
         *
         * | Code | Status                           |
         * | :--- | :------------------------------- |
         * | 0x00 | not configured                   |
         * | 0x01 | configured, stoped, no data      |
         * | 0x02 | running                          |
         * | 0x04 | stopped, not enough data sampled |
         * | 0x05 | stopped, data ready              |
         */
        this.GetRecorderStatus = function(id) {
            return jrpc.call('GetRecorderStatus', [id]);
        };

        /**
         * Gets recorded data.
         *
         * @example
         * let result = await pcm.GetRecorderData(id);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number} id Recorder ID.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type array of arrays of numbers.
         */
        this.GetRecorderData = function(id) {
            return jrpc.call('GetRecorderData', [id]);
        };

        /**
         * Opens a pipe.
         *
         * @example
         * let result = await pcm.PipeOpen(0, 100, 100);
         * if (result.status === "OK") {
         *     console.log("Pipe open.");
         * }
         *
         * @param   {number} port         Pipe ID.
         * @param   {number} txBufferSize Send buffer size.
         * @param   {number} rxBufferSize Receive buffer size.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.PipeOpen = function(port, txBufferSize, rxBufferSize) {
            return jrpc.call('PipeOpen', [port, txBufferSize, rxBufferSize]);
        };
        
        /**
         * Closes a pipe.
         *
         * @example
         * let result = await pcm.PipeClose(0);
         * if (result.status === "OK") {
         *     console.log("Pipe closed.");
         * }
         *
         * @param   {number} port Pipe ID.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.PipeClose = function(port) {
            return jrpc.call('PipeClose', [port]);
        };

        /**
         * Flushes a pipe.
         *
         * @example
         * let result = await pcm.PipeFlush(0);
         * if (result.status === "OK") {
         *     console.log("Pipe flushed.");
         * }
         *
         * @param   {number} port Pipe ID.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.PipeFlush = function(port, timeout) {
            return jrpc.call('PipeFlush', [port, timeout]);
        };

        /**
         * Sets pipes default receive mode.
         *
         * @example
         * let result = await pcm.PipeSetDefaultRxMode(false, 100);
         * if (result.status === "OK") {
         *     console.log("Default RX mode updated.");
         * }
         *
         * @param   {boolean} rxAllOrNothing Flag specifying whether the data should be read all at once.
         * @param   {number}  rxTimeout_ms   Read timeout in milliseconds.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.PipeSetDefaultRxMode = function(rxAllOrNothing, rxTimeout_ms) {
            return jrpc.call('PipeSetDefaultRxMode', [rxAllOrNothing, rxTimeout_ms]);
        };

        /**
         * Sets pipes default string mode.
         *
         * @example
         * let result = await pcm.PipeSetDefaultStringMode(false);
         * if (result.status === "OK") {
         *     console.log("Default string mode updated.");
         * }
         *
         * @param   {boolean} unicode Flag specifying whether the string are using unicode encoding.
         * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
         */
        this.PipeSetDefaultStringMode = function(unicode) {
            return jrpc.call('PipeSetDefaultStringMode', [unicode]);
        };

        /**
         * Requests the number of bytes pending on the receive buffer.
         *
         * @example
         * let result = await pcm.PipeGetRxBytes(0);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number} port Pipe ID.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number.
         */
        this.PipeGetRxBytes = function(port) {
            return jrpc.call('PipeGetRxBytes', [port]);
        };

        /**
         * Requests the number of bytes pending on the send buffer.
         *
         * @example
         * let result = await pcm.PipeGetTxBytes(0);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number} port Pipe ID.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number.
         */
        this.PipeGetTxBytes = function(port) {
            return jrpc.call('PipeGetTxBytes', [port]);
        };

        /**
         * Requests the number of free bytes from the send buffer.
         *
         * @example
         * let result = await pcm.PipeGetTxFree(0);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number} port Port number that identified the pipe.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number.
         */
        this.PipeGetTxFree = function(port) {
            return jrpc.call('PipeGetTxFree', [port]);
        };

        /**
         * Requests the receive buffer size of a pipe.
         *
         * @example
         * let result = await pcm.PipeGetRxBufferSize(0);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number} port Pipe ID.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number.
         */ 
        this.PipeGetRxBufferSize = function(port) {
            return jrpc.call('PipeGetRxBufferSize', [port]);
        };

        /**
         * Requests the send buffer size of a pipe.
         *
         * @example
         * let result = await pcm.PipeGetTxBufferSize(0);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number} port Pipe ID.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number.
         */ 
        this.PipeGetTxBufferSize = function(port) {
            return jrpc.call('PipeGetTxBufferSize', [port]);
        };

        /**
         * Writes a string to a pipe.
         *
         * @example
         * let result = await pcm.PipeWriteString(0, "Hello world!", false, false);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number}  port         Pipe ID.
         * @param   {string}  str          String to be written to the pipe.
         * @param   {boolean} allOrNothing Flag specifying whether the string should be sent all at once.
         * @param   {boolean} unicode      Flag specifying whether the string is unicode encoded.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen characters.
         */ 
        this.PipeWriteString = function(port, str, allOrNothing, unicode) {
            return jrpc.call('PipeWriteString', [port, str, allOrNothing, unicode]);
        };

        /**
         * Writes an array of signed integers to a pipe.
         *
         * @example
         * let result = await pcm.PipeWriteIntArray(0, 2, [1, 2, 3, 4, 5], false);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number}        port         Pipe ID.
         * @param   {number}        elSize       Element size, can be 1, 2, 4, or 8.
         * @param   {Array<number>} data         Array of integers to be written.
         * @param   {boolean}       allOrNothing Flag specifying whether the string should be sent all at once.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen array elements.
         */
        this.PipeWriteIntArray = function(port, elSize, data, allOrNothing) {
            return jrpc.call('PipeWriteIntArray', [port, elSize, data, allOrNothing]);
        };

        /**
         * Writes an array of unsigned integers to a pipe.
         *
         * @example
         * let result = await pcm.PipeWriteUIntArray(0, 4, [100, 200, 300, 400, 500], false);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number}        port         Pipe ID.
         * @param   {number}        elSize       Element size, can be 1, 2, 4, or 8.
         * @param   {Array<number>} data         Array of integers to be written.
         * @param   {boolean}       allOrNothing Flag specifying whether the string should be sent all at once.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen array elements.
         */
        this.PipeWriteUIntArray = function(port, elSize, data, allOrNothing) {
            return jrpc.call('PipeWriteUIntArray', [port, elSize, data, allOrNothing]);
        };

        /**
         * Writes an array of floats to a pipe.
         *
         * @example
         * let result = await pcm.PipeWriteFloatArray(0, [1.0, 2.0, 3.0, 4.0, 5.0], false);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number}        port         Pipe ID.
         * @param   {Array<number>} data         Array of integers to be written.
         * @param   {boolean}       allOrNothing Flag specifying whether the string should be sent all at once.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen array elements.
         */
        this.PipeWriteFloatArray = function(port, data, allOrNothing) {
            return jrpc.call('PipeWriteFloatArray', [port, data, allOrNothing]);
        };

        /**
         * Writes an array of doubles to a pipe.
         *
         * @example
         * let result = await pcm.PipeWriteDoubleArray(0, [10.0, 20.0, 30.0, 40.0, 50.0], false);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number}        port         Pipe ID.
         * @param   {Array<number>} data         Array of integers to be written.
         * @param   {boolean}       allOrNothing Flag specifying whether the string should be sent all at once.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of successfully writen array elements.
         */
        this.PipeWriteDoubleArray = function(port, data, allOrNothing) {
            return jrpc.call('PipeWriteDoubleArray', [port, data, allOrNothing]);
        };        
        
       /**
        * Reads a string from a pipe.
        *
        * @example
        * let result = await pcm.PipeReadString(0, 100, 512, false, false);
        * if (result.status === "OK") {
        *     console.log(result.data);
        * }
        *
        * @param   {number}  port         Pipe ID.
        * @param   {number}  rxTimeout_ms Read timeout in milliseconds.
        * @param   {number}  charsToRead  Number of characters to read.
        * @param   {boolean} allOrNothing Flag specifying whether the string should be read all at once.
        * @param   {boolean} unicode      Flag specifying whether the string is unicode encoded.
        * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number string.
        */
        this.PipeReadString = function(port, rxTimeout_ms, charsToRead, allOrNothing, unicode) {
            return jrpc.call('PipeReadString', [port, rxTimeout_ms, charsToRead, allOrNothing, unicode]);
        };

        /**
         * Reads an array of signed integers from a piep.
         *
         * @example
         * let result = await pcm.PipeReadIntArray(0, 2, 100, 100, false);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number}  port         Pipe ID.
         * @param   {number}  elSize       Element size, can be 1, 2, 4, or 8.
         * @param   {number}  rxTimeout_ms Read timeout in milliseconds.
         * @param   {number}  size         The size of the array (number of elements).
         * @param   {boolean} allOrNothing Flag specifying whether the array should be read all at once.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type Array<number>.
         */
        this.PipeReadIntArray = function(port, elSize, rxTimeout_ms, size, allOrNothing) {
            return jrpc.call('PipeReadIntArray', [port, elSize, rxTimeout_ms, size, allOrNothing]);
        };

        /**
         * Reads an array of unsigned integers from a piep.
         *
         * @example
         * let result = await pcm.PipeReadUIntArray(0, 4, 100, 100, false);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number}  port         Pipe ID.
         * @param   {number}  elSize       Element size, can be 1, 2, 4, or 8.
         * @param   {number}  rxTimeout_ms Read timeout in milliseconds.
         * @param   {number}  size         The size of the array (number of elements).
         * @param   {boolean} allOrNothing Flag specifying whether the array should be read all at once.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type Array<number>.
         */
        this.PipeReadUIntArray = function(port, elSize, rxTimeout_ms, size, allOrNothing) {
            return jrpc.call('PipeReadUIntArray', [port, elSize, rxTimeout_ms, size, allOrNothing]);
        };       
        
       /**
        * Reads an array of floats from a piep.
        *
        * @example
        * let result = await pcm.PipeReadFloatArray(0, 100, 100, false);
        * if (result.status === "OK") {
        *     console.log(result.data);
        * }
        *
        * @param   {number}  port         Pipe ID.
        * @param   {number}  rxTimeout_ms Read timeout in milliseconds.
        * @param   {number}  size         The size of the array (number of elements).
        * @param   {boolean}  allOrNothing Flag specifying whether the array should be read all at once.
        * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type Array<number>.
        */
        this.PipeReadFloatArray = function(port, rxTimeout_ms, size, allOrNothing) {
            return jrpc.call('PipeReadFloatArray', [port, rxTimeout_ms, size, allOrNothing]);
        };

       /**
        * Reads an array of doubles from a piep.
        *
        * @example
        * let result = await pcm.PipeReadDoubleArray(0, 100, 100, false);
        * if (result.status === "OK") {
        *     console.log(result.data);
        * }
        *
        * @param   {number}  port         Pipe ID.
        * @param   {number}  rxTimeout_ms Read timeout in milliseconds.
        * @param   {number}  size         The size of the array (number of elements).
        * @param   {boolean} allOrNothing Flag specifying whether the array should be read all at once.
        * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type Array<number>.
        */
        this.PipeReadDoubleArray = function(port, rxTimeout_ms, size, allOrNothing) {
            return jrpc.call('PipeReadDoubleArray', [port, rxTimeout_ms, size, allOrNothing]);
        };

       /**
        * Opens a file on the mashine the servce is running one.
        * @see {@link PCM#LocalFileClose LocalFileClose}
        *
        * @example
        * let result = await pcm.LocalFileOpen("D:\\Temp\\temp.txt", "w+");
        * if (result.status === "OK") {
        *     console.log(result.data);
        * }
        *
        * @param   {string} file Path to the file.
        * @param   {string} mode NodeJS file system {@link https://nodejs.org/api/fs.html#fs_file_system_flags flags}.
        * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing file descriptor.
        */
        this.LocalFileOpen = function(file, mode) {
            return jrpc.call('LocalFileOpen', [file, mode]);
        };
              
       /**
        * Closes a file.
        * @see {@link PCM#LocalFileOpen LocalFileOpen}
        *
        * @example
        * let result = await pcm.LocalFileClose(3);
        * if (result.status === "OK") {
        *     console.log("File closed.");
        * }
        *
        * @param   {number} handle File descriptor.
        * @returns {Promise<FML_Response>} The result does not carry any relevant data beside response status.
        */
        this.LocalFileClose = function(handle) {
            return jrpc.call('LocalFileClose', [handle]);
        };
              
        /**
         * Reads a string from an open file.
         * @see {@link PCM#LocalFileOpen LocalFileOpen}
         *
         * @example
         * let result = await pcm.LocalFileReadString(3, 255, false);
         * if (result.status === "OK") {
         *     console.log(result.data);
         * }
         *
         * @param   {number}  handle      File descriptor.
         * @param   {number}  charsToRead Numbers of characters to read.
         * @param   {boolean} unicode     Flag specifying whether the string is unicode encoded.
         * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type string.
         */
        this.LocalFileReadString = function(handle, charsToRead, unicode) {
            return jrpc.call('LocalFileReadString', [handle, charsToRead, unicode]);
        };        
        
       /**
        * Writes a string to an open file.
        * @see {@link PCM#LocalFileOpen LocalFileOpen}
        *
        * @example
        * let result = await pcm.LocalFileWriteString(3, "Hello world!", false);
        * if (result.status === "OK") {
        *     console.log(result.data);
        * }
        *
        * @param   {number}  handle      File descriptor.
        * @param   {number}  charsToRead Numbers of characters to read.
        * @param   {boolean} unicode     Flag specifying whether the string is unicode encoded.
        * @returns {Promise<FML_Response>} In case of success, resolved promise will contain data property of type number representing the number of written characters.
        */
        this.LocalFileWriteString = function(handle, str, unicode) {
            return jrpc.call('LocalFileWriteString', [handle, str, unicode]);
        };
    };

    if (typeof define == 'function' && define.amd) {
      define('PCM', [], function () {
        return PCM;
      });
    }
    else if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
      module.exports = PCM;
    }
    else if (typeof root !== "undefined") {
      root.PCM = PCM;
    }
    else {
      return PCM;
    }

  })(this);
  