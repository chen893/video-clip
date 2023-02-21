const { readFile } = require("fs/promises");
const { readdir } = require("fs/promises");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { mkdir } = require("fs/promises");
const { existsSync } = require("fs");
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
    parseInt(k) * 0.01;
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
          const message = item.split(",,").pop().replace("\r", "").trim();
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
  await findWordInMovies("猴子", "大话西游之月光宝盒");
}

// const video = ffmpeg(inputFilePath).seekInput(470.069).duration(478.032 - 470.069).output(outputFilePath).on("end", function () {
//   console.log("file has been processed");
// }).run();

startWork();
// ready('波罗蜜') .format('flv');
async function ready(key) {
  console.log("进入ready");
  const inputPath = path.join(__dirname, "output", key);
  let files = await readdir(inputPath);
  console.log(files);
  files = files.map((item) => path.join(inputPath, item));
  console.log(files);
  if (!existsSync(path.join("collection"))) {
    await mkdir(path.join("collection"));
  }
  const command = ffmpeg();
  command.setFfmpegPath(ffmpegPath);
  files.forEach((clip) => {
    console.log("---------");
    console.log("clip", clip);
    command.input(clip);
  });
  try {

  const collectionPath = path.join(__dirname, "collection", key + ".mkv");
  command
    .mergeToFile(collectionPath,path.join(__dirname, "collection") );
    // console.log(ffmpeg.concat, 'fn')
  // ffmpeg.concat(files, collectionPath)

  }
  catch(err) {
    console.log(err.message)
  }
}

async function findWordInMovies(key, movie) {
  let target = 0;
  let success = 0;
  const isExistDir = existsSync(path.join("output", key));

  if (!isExistDir) {
    await mkdir(path.join("output", key));
  }
  let targetMovie = {};
  for (let m of filmCollection) {
    if (m.name === movie) {
      targetMovie = m;
      break;
    }
  }
  let time = 1000;
  const { subtitleContent } = targetMovie;
  for (sub of subtitleContent) {
    const { message, startTime, endTime } = sub;

    if (message.includes(key)) {
      // console.log(startTime, endTime);
      time = time + 1000;
      setTimeout(() => {
        success++;

        const video = ffmpeg(inputFilePath).native();
        const pro = video
          .seekInput(startTime)
          .duration(endTime - startTime)
          .output(path.join("output", key, message + ".mkv"))
          .on("end", function () {
            target++;
            if (target === success) ready(key);
            console.log("file has been processed");
          })
          .run();
      }, time);

      // console.log(typeof pro, "pro");
      // break
    }
  }
}
