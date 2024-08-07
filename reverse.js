const fs = require('fs');
const path = require('path');

// Directory containing the files
const directoryPath = './images'; // Replace with your folder path

// Function to remove a numeric prefix followed by a dash from files
function removePrefixFromFiles(dirPath) {
    // Read the contents of the directory
    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        // Sort files alphabetically (optional)
        files.sort();

        // Iterate over each file
        files.forEach((file) => {
            const oldPath = path.join(dirPath, file);
            
            // Use a regex to remove a leading number and dash (e.g., "123-")
            const newFileName = file.replace(/^\d+-/, '');
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
removePrefixFromFiles(directoryPath);
