const binaryData = convertIntelHexToBinaryData('firmware.hex');

const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const file = e.dataTransfer.files[0];
    const reader = new FileReader();

    const fileNameElement = document.createElement('p');
    fileNameElement.textContent = `File Name: ${file.name}`;
    dropZone.appendChild(fileNameElement);

    reader.onload = function (e) {
        const content = e.target.result;
        // Process the file content here
        console.log(content);
    };

    reader.readAsText(file);
});


function convertIntelHexToBinaryData(hexFilePath) {
  const fs = require('fs');
  const data = fs.readFileSync(hexFilePath, 'utf8');

  // Initialize an empty array to store the binary data
  const binaryData = [];

  // Initialize an extended linear address variable
  let extendedLinearAddress = 0;

  // Split the hex data into lines
  const lines = data.split('\n');

  // Iterate through each line
  for (const line of lines) {
    // Extract the record type from the line
    const recordType = line.substr(7, 2);

    // Handle extended linear address record
    if (recordType === '04') {
      // Extract the extended linear address from the line
      const extendedLinearAddressData = line.substr(9, 8);
      extendedLinearAddress = parseInt(extendedLinearAddressData, 16);
    }

    // Handle data record
    if (recordType === '00') {
      // Extract the address, data, and checksum from the line
      const address = parseInt(line.substr(1, 4), 16);
      const data = line.substr(9, line.length - 13);
      const checksum = parseInt(line.substr(line.length - 2, 2), 16);

      // Calculate the expected checksum
      let expectedChecksum = 0;
      for (let i = 0; i < data.length; i += 2) {
        const byte = parseInt(data.substr(i, 2), 16);
        expectedChecksum += byte;
      }
      expectedChecksum = (255 - expectedChecksum) & 0xFF;

      // Verify the checksum
      if (checksum !== expectedChecksum) {
        console.error(`Checksum error for line: ${line}`);
        return []; // Stop processing the file if an error is encountered
      }

      // Convert the hex data to binary data
      const binaryDataChunk = Buffer.from(data, 'hex');

      // Calculate the absolute memory address
      const absoluteMemoryAddress = extendedLinearAddress | address;

      // Append the binary data chunk to the binary data array at the corresponding absolute memory address
      for (let i = 0; i < binaryDataChunk.length; i++) {
        binaryData[absoluteMemoryAddress + i] = binaryDataChunk[i];
      }
    }

    // Check for end of file record
    if (recordType === '01') {
      break;
    }
  }

  return binaryData;
}
