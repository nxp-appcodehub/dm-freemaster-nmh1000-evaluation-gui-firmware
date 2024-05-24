/** Register tab logic */

/** Global variable that stores local file CSV data */
var csv_text;                // raw csv text
var csv_parsed_data;         // parsed csv in matrix like format
var read_register_index;     // if not 0 specifies the reagister index being read
var read_all_registers_flag; // if not 0 all reagisters are being read

/**
 * Opens a local CSV file for data read
 */
function load_local_csv() {
  csv_text = '';
  pcm.LocalFileOpen('reg.csv', 'r')
    .then(resp => read_csv(resp.data))
    .catch(err => console.error(err, 'Could not open local csv file'));
}

/**
 * Reads a local CSV file
 * @param {number} file_handler - file identifier used by FreeMASTER to address local file 
 */
function read_csv(file_handler) {
  pcm.LocalFileReadString(file_handler, 1000, false)
    .then(resp => {
      if (resp.data) {
        csv_text += resp.data;
        read_csv(file_handler);
      } else {
        pcm.LocalFileClose(file_handler);
        csv_parsed_data = $.csv.toArrays(csv_text);
        fill_registers_table(csv_parsed_data);
      }
    })
    .catch(err => pcm.LocalFileClose(file_handler));
}

/**
 * Fills in registers table
 * @param {Array} data - Parsed CSV data as a matrix.
 */
function fill_registers_table(csv_data) {
  // 1. select the table element
  var table = d3.select('.container.tree-container');

  // 2. assign data to each 'virtual' table row
  var table_rows = table
    .selectAll('div.row')
    .data(csv_data);

  // 3. create 'real' rows and fill in the data
  var updated_rows = table_rows
    .enter()
    .append('div')
    .attr('class', function (data, index) {
      return index == 0 ? 'th row' : 'tr row';
    })
    .merge(table_rows)
    .on('click', register_row_clicked);

  // 4. remove redundant rows
  table_rows
    .exit()
    .remove();

  // 5. assign data to each 'virtual' table row cells
  var table_columns = updated_rows
    .selectAll('div')
    .data(function (csv_row) {
      return csv_row.slice(0, 5);
    });

  // 6. create 'real' cells and fill in the data
  table_columns
    .enter()
    .append('div')
    .attr('class', function (data, index) {
      return index == 0 ? 'col-4 item' : 'col-2';
    })
    .merge(table_columns)
    .text(function (csv_cell) {
      return csv_cell;
    });
}

/**
 * Handles click event on register table rows
 * @param {Array} data - row cell data
 */
function register_row_clicked(data) {
  // reserved registers cannot be selected
  if (data[0].trim() == 'RESERVED')
    return;
  $('.container.tree-container .checked').removeClass('checked');
  $(this).children(':first').addClass('checked');
  // fill in bit fields table
  fill_bitfield_table(data);
  // fill in description table
  fill_description_table(data);
}

/**
 * Fills in registers table
 * @param {Array} data - Register decription parsed line from CSV.
 */
function fill_bitfield_table(data) {
  var row = d3.select('#reg_decs');

  var columns = row
    .selectAll('div')
    .data(data.slice(5, 13))
    .text(function (bit_desc) {
      return bit_desc;
    });

  row = d3.select('#reg_val')
    .attr('class', function () {
      return 'row' + (data[2] == 'R' ? '' : ' editable');
    });

  columns = row
    .selectAll('div')
    .data(function() {
      var val = parseInt(data[4], 16).toString(2);
      return val.padStart(8, '0').split('');
    })
    .attr('class', function () {
      return 'col-table';
    })
    .text(function (bit_val) {
      return bit_val;
    })
    .on('click', bitfield_clicked);
}

/**
 * Handles click event on bitfield cell
 * @param {Array} data - bit field value in the model
 */
function bitfield_clicked(data) {
  if (!$(this.parentElement).hasClass('editable')) {
    return;
  }
  var cell_data = $(this).text();
  if (cell_data == data) {
    $(this).addClass('modified');
  } else {
    $(this).removeClass('modified');
  }
  if ($(this).text() == '0') {
    $(this).text('1');
  } else {
    $(this).text('0');
  }
}

/**
 * Fills in registers table
 * @param {Array} data - Register decription parsed line from CSV.
 */
function fill_description_table(data) {
  var table = d3.select('#description');

  var rows = table
    .selectAll('div:not(.header)')
    .data(function() {
      return data.slice(13, 21).filter(cell => cell != '');
    });

  var updated_rows = rows
    .enter()
    .append('div')
    .attr('class', function () {
      return 'row bordered';
    })
    .merge(rows)
    .text(function (bit_desc) {
      return bit_desc;
    });

  rows
    .exit()
    .remove();
}

/**
 * The register tab loop
 */
function register_tab_loop() {

  if (reading) {
    return;
  }

  reading = true;

  // Read the last selected register
  pcm.ReadVariable('read_trigger')
    .then(response => {
      if (response.data == 0 && read_register_index) {
        pcm.ReadVariable('read_value')
          .then(response => {
            var reg_value_hex = response.data.toString(16);
            reg_value_hex = reg_value_hex.padStart(2, '0');
            reg_value_hex = '0x' + reg_value_hex;
            csv_parsed_data[read_register_index][4] = reg_value_hex;
            fill_registers_table(csv_parsed_data);
            fill_bitfield_table(csv_parsed_data[read_register_index]);
            read_register_index = 0;
            reading = false;
          });
      } else {
        reading = false;
      }
    });

    var regall_size;
	pcm.ReadVariable('readall_size')
	.then(response => {
	  regall_size = response;
	});

  // Read all registers
  pcm.ReadVariable('readall_trigger')
    .then(response => {
      if (response.data == 0 && read_all_registers_flag) {
        pcm.ReadUIntArray('registers.readall_value', regall_size, 1)
          .then(response => {
            for (var i = 1; i < csv_parsed_data.length; ++i) {
              var addr = parseInt(csv_parsed_data[i][1], 16);
			  if (csv_parsed_data[i][0].trim() == 'RESERVED'){
				  continue;
			  }
              var reg_value_hex = response.data[addr].toString(16);
              reg_value_hex = reg_value_hex.padStart(2, '0');
              reg_value_hex = '0x' + reg_value_hex;
              csv_parsed_data[i][4] = reg_value_hex;
            }
            fill_registers_table(csv_parsed_data);
            read_all_registers_flag = 0;
          });
      } else {
        reading = false;
      }
    });
}

/*
 * Initialise event handlers
 */
function register_tab_event_handlers() {
  // Write button click
  $('#write').on('click', write_register);
  $('#read').on('click', set_read_register_flag);
  $('#readAll').on('click', set_read_all_registers_flag);
  $('#saveConfig').on('click', save_csv);
  $('#loadConfig').on('click', function () {
    // trigger file open event
    $('#openCSV').click();
  });
  $('#openCSV').on('change', load_csv);
}

/*
 * Returns selected register index
 */
function get_selected_register_index() {
  var selected_row = $('.tree-container .row > .item.checked').parent();
  return $(selected_row).index();
}

/*
 * Writes a value to the selected register
 */
function write_register() {
  var register_index = get_selected_register_index();
  var offset = parseInt(csv_parsed_data[register_index][1], 16);
  var bits_columns = $('#reg_val').children();
  var value = '';
  for (var i = 0; i < bits_columns.length; ++i) {
    value += bits_columns[i].innerText;
  }
  value = parseInt(value, 2);
  Promise.all([
    pcm.WriteVariable('Offset', offset),
    pcm.WriteVariable('Value', value),
    pcm.WriteVariable('Trigger', 1)
  ]).catch(err => alert('Could not write'));
}

/*
 * Triggers a read operation on the selected register
 */ 
function set_read_register_flag() {
  read_register_index = get_selected_register_index();
  var offset = parseInt(csv_parsed_data[read_register_index][1], 16);
  Promise.all([
    pcm.WriteVariable('read_offset', offset),
    pcm.WriteVariable('read_trigger', 1)
  ]).catch(err => alert('Could not write'));
}

/*
 * Triggers a read operation on all registers
 */
function set_read_all_registers_flag() {
  read_all_registers_flag = 1;
  pcm.WriteVariable('readall_trigger', 1).catch(err => alert('Could not write'));
}

/**
 * Saves data to a CSV file
 * @param {object} e - File read event
 */
function save_csv() {
  // update to save configuration
  var BOM = '\uFEFF';
  var csvData = BOM + $.csv.fromArrays(csv_parsed_data);
  var blob = new Blob([csvData], {
    type: 'text/csv;charset=utf-8'
  });
  saveAs(blob, 'config.csv');
}

/**
 * Loads and CSV file
 * @param {object} e - File read event
 */
function load_csv(e) {
  if (e.target.files != undefined) {
    var reader = new FileReader();
    reader.onload = function (e) {
      csv_parsed_data = csv_parsed = $.csv.toArrays(e.target.result);
      write_all_registers(csv_parsed_data);
      fill_registers_table(csv_parsed_data);
    };
    reader.readAsText(e.target.files.item(0));
  }
  return false;
}

/**
 * Writes all register values
 * @param {object} registers - Array of registers entries from csv
 */
function write_all_registers(registers) {
  for (var i = 1; i < registers.length; ++i) {
    if (registers[i][3] !== 'R') {
      Promise.all([
        pcm.WriteVariable('Offset', parseInt(registers[i][1], 16)),
        pcm.WriteVariable('Value', parseInt(registers[i][4], 16)),
        pcm.WriteVariable('Trigger', 1)
      ]).catch(err => alert('Could not write'));
    }
  }
}