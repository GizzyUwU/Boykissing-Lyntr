const fs = require('fs');
const path = require('path');

// Directory containing the files
const directoryPath = './images'; // Replace with your folder path

// Function to add a numeric prefix to files
function addPrefixToFiles(dirPath) {
    // Read the contents of the directory
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        // Sort files alphabetically (optional)
        files.sort();

        // Iterate over each file
        files.forEach((file, index) => {
            const oldPath = path.join(dirPath, file);
            const newFileName = `${index + 1}-${file}`;
            const newPath = path.join(dirPath, newFileName);

            // Rename the file
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    console.error(`Error renaming file ${file}:`, err);
                } else {
                    console.log(`Renamed ${file} to ${newFileName}`);
                }
            });
        });
    });
}

// Run the function
addPrefixToFiles(directoryPath);
