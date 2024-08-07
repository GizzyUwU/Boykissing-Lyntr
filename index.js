const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');
let user;
require('dotenv').config()

const API_BASE_URL = 'https://lyntr.com/api';
const TOKEN = process.env.token; // Replace with your token

const headers = {
    'accept': '*/*',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'cookie': `_TOKEN__DO_NOT_SHARE=${TOKEN};`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
};

async function getUser() {
    try {
        const response = await axios.get(`${API_BASE_URL}/me`, { headers });
        console.log(`Account Name: ${response.data.username} Handle: ${response.data.handle} Id: ${response.data.id} Iq: ${response.data.iq}`);
        return { id: response.data.id, handle: response.data.handle };
    } catch (error) {
        console.error('Error fetching user ID:', error);
        throw error;
    }
}

async function getFeed(handle) {
    try {
        const response = await axios.get(`${API_BASE_URL}/feed?handle=${handle}`, { headers });
        return response.data.lynts;
    } catch (error) {
        console.error('Error fetching feed:', error);
        throw error;
    }
}

function containsDay(content) {
    const dayPattern = /day:\s*\d+/;
    return dayPattern.test(content);
}

function isOlderThan24Hours(createdAt) {
    const postDate = new Date(createdAt);
    const currentDate = new Date();
    const diff = currentDate - postDate;
    return diff > 24 * 60 * 60 * 1000;
}

async function postLynt(content) {
    const form = new FormData();
    form.append('content', content);

    try {
        await axios.post(`${API_BASE_URL}/lynt`, form, {
            headers: {
                ...headers,
                ...form.getHeaders(),
                'Host': 'lyntr.com',
                'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126"',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Origin': 'https://lyntr.com',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': 'https://lyntr.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Priority': 'u=1, i',
            },
        });
        console.log('Posted new lynt');
    } catch (error) {
        console.error('Error posting new lynt:', error);
    }
}

async function postLyntImage(imagePath, content) {
    const form = new FormData();
    form.append('content', content);
    form.append('image', fs.createReadStream(imagePath), path.basename(imagePath));
    try {
        const response = await axios.post(`${API_BASE_URL}/lynt`, form, {
            headers: {
                ...headers,
                ...form.getHeaders(),
                'Host': 'lyntr.com',
                'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126"',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Origin': 'https://lyntr.com',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': 'https://lyntr.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Priority': 'u=1, i',
            }
        });
        console.log('Posted new lynt with image');
    } catch (error) {
        console.error('Error posting new lynt with image:', error);
    }
}

async function main() {
    try {
        user = await getUser();
        console.log('Account ID:', user.id);
        const lynts = await getFeed(user.handle);

        let latestDayNumber = null;
        let latestLynt = null;

        const imageDir = path.resolve(__dirname, 'images');
        const imageFiles = fs.readdirSync(imageDir);

        for (const lynt of lynts) {
            if (lynt.content.includes('Day:')) {
                const dayData = lynt.content.match(/Day:\s*(\d+)/);
                if (dayData) {
                    const dayNumber = parseInt(dayData[1], 10);
                    if (!latestDayNumber || dayNumber > latestDayNumber) {
                        latestDayNumber = dayNumber;
                        latestLynt = lynt;
                    }
                }
            }
        }

        let newDayNumber;
        if (!latestLynt) {
            latestDayNumber = 1;
            latestLynt = {
                content: `Day: ${latestDayNumber}`,
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            };
            newDayNumber = 1;
            const newContent = `Day: ${newDayNumber}`;
            const matchingFile = imageFiles.find(file => file.startsWith(newDayNumber.toString()) && /\.(jpg|jpeg|png|gif)$/i.test(file));
    
            if (matchingFile) {
                const imagePath = path.resolve(imageDir, matchingFile);
                await postLyntImage(imagePath, newContent);
            } else {
                console.log(`Image for Day ${newDayNumber} not found in directory.`);
            }
        } else {
            if(!isOlderThan24Hours(latestLynt.createdAt)) return console.info("Hasn't been 24 hours");
            newDayNumber = latestDayNumber + 1;
            const newContent = `Day: ${newDayNumber}`;
            const matchingFile = imageFiles.find(file => file.startsWith(newDayNumber.toString()) && /\.(jpg|jpeg|png|gif)$/i.test(file));
    
            if (matchingFile) {
                const imagePath = path.resolve(imageDir, matchingFile);
                await postLyntImage(imagePath, newContent);
            } else {
                console.log(`Image for Day ${newDayNumber} not found in directory.`);
            }
        }
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

async function runScheduledTask() {
    await main();
    console.log('Checking when to run next...');
    const lynts = await getFeed(user.handle);
    let latestLynt = null;

    for (const lynt of lynts) {
        if (lynt.content.includes('Day:')) {
            if (!latestLynt || new Date(lynt.createdAt) > new Date(latestLynt.createdAt)) {
                latestLynt = lynt;
            }
        }
    }

    let delay = 24 * 60 * 60 * 1000; // Default to 24 hours
    if (latestLynt) {
        const timeElapsed = Date.now() - new Date(latestLynt.createdAt).getTime();
        if (timeElapsed < delay) {
            delay -= timeElapsed;
        }
    }

    console.log(`Next run in ${delay / (60 * 60 * 1000)} hours.`);
    setTimeout(runScheduledTask, delay);
}

runScheduledTask();
