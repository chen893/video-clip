const { readFile } = require("fs/promises");
const { readdir } = require("fs/promises");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

const inputFilePath = path.join(__dirname, "movies", "1", "1.mkv");

const outputFilePath = path.join(__dirname, "output", "test.mkv");
const subtitlePath = path.join(__dirname, "subtitle");
// console.log(outputFilePath);
// {name: , subTitleContent}
const filmCollection = [];

let subtitleContent = [];

function timeTo(time) {
  let k = time.split(".")[1];
  let t = time.split(".")[0];
  let arr = t.split(":");
  let sum =
    parseInt(arr[0]) * 60 * 60 +
    parseInt(arr[1]) * 60 +
    parseInt(arr[2]) +
    parseInt(k) * 0.001;
  return sum;
}
async function startWork() {
  const data = await readdir(subtitlePath);
  const arr = data.map((p) => {
    return path.join(subtitlePath, p);
  });
  for (let item of arr) {
    await readFile(item, {
      encoding: "utf-8",
    }).then(
      (data) => {
        subtitleContent = [];
        const messageArr = data.split("\n");
        messageArr.map((item) => {
          const message = item.split(",,").pop();
          const time = item.slice(12, 33).split(",");
          // console.log(time[0], timeTo(time[0]));
          // console.log(time[0], time[1])
          if (time?.length >= 2) {
            subtitleContent.push({
              startTime: timeTo(time[0]),
              endTime: timeTo(time[1]),
              message,
            });
          }
        });

        const title = messageArr[1].split(": ")[1].replace("\r", "");
        // console.log(title)

        filmCollection.push({
          name: title,
          subtitleContent,
        });
        // console.log(filmCollection);
      },
      (err) => {
        console.log(err.message);
      }
    );
  }

  // console.log(filmCollection);
  findWordInMovies("爱", "大话西游之月光宝盒");
}

const video = ffmpeg(inputFilePath);
// const video = ffmpeg(inputFilePath).seekInput(470.069).duration(478.032 - 470.069).output(outputFilePath).on("end", function () {
//   console.log("file has been processed");
// }).run();

startWork();

function findWordInMovies(key, movie) {
  let targetMovie = {};
  for (let m of filmCollection) {
    if (m.name === movie) {
      targetMovie = m;
      break;
    }
  }
  const {subtitleContent} = targetMovie
  for (sub of subtitleContent) {

    const { message, startTime, endTime } = sub;
    
    if (message.includes(key)) {
      console.log(startTime, endTime)
      video
        .seekInput(startTime)
        .duration(endTime - startTime)
        .output(path.join("output", message + ".mkv"))
        .on("end", function () {
          console.log("file has been processed");
        })
        .run();
        break
    }
    
  };
}
