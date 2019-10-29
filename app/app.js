const express = require('express')
const http = require('http')
const path = require('path')
const app = express()
const fs = require('fs')


const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

app.use('/', express.static(path.join(__dirname, 'public')))

server = http.createServer(app).listen(3000, function() {
    console.log('Example app listening on port 3000')
})

// WebSocket サーバを起動
const socketio = require('socket.io')
const io = socketio.listen(server)


// クライアントが接続したときの処理
io.on('connection', (socket) => {
    let sampleRate = 16000
    let buffer = []

    // 録音開始の合図を受け取ったときの処理
    socket.on('start', (data) => {
        sampleRate = data.sampleRate


        console.log(`Sample Rate: ${sampleRate}`)
        fs.writeFileSync( "./public/wav/test.wav" , "" )

    })

    // PCM データを受信したときの処理
    socket.on('send_pcm', (data) => {
        // data: { "1": 11, "2": 29, "3": 33, ... }
        const itr = data.values()
        const buf = new Array(data.length)
        for (var i = 0; i < buf.length; i++) {
            buf[i] = itr.next().value
        }
        buffer = buffer.concat(buf)
    })

    // 録音停止の合図を受け取ったときの処理
    socket.on('stop', (data, ack) => {
        const f32array = toF32Array(buffer)
        const filename = `/home/str0611/app/public/wav/test.wav`
        exportWAV(f32array, sampleRate, filename)
        ack({ filename: filename })

        const wavfile = fs.readFileSync("/home/str0611/app/public/wav/test.wav")

        var request = new XMLHttpRequest();
        request.open("POST", "http://160.16.104.250:8000/asr_julius",true)
        request.setRequestHeader('content-type', 'audio/wav')

        request.send(wavfile);
  
        request.onreadystatechange = function() {
          if(request.readyState === 4 && request.status === 200) {
  
          console.log( request.responseText )

          var result = request.responseText

          socket.emit('result12', {message: result }, function (data) {
            console.log('result: ' + data);
          });

        
          }
        }

       
        // const xhr = new XMLHttpRequest();
        // var data;
        // window.onload = function onLoad() {
        //   xhr.open('GET', './wav/test.out', false); // GET????????????
        //   xhr.onload = () => {
        //       data = xhr.responseText;
        //   };
        //   xhr.onerror = () => {
        //     console.log("error!");
        //   };

        // xhr.send();

        //   cts1 = document.getElementById("result");
        //   cts1.innerText = "55555";




    })
})

// Convert byte array to Float32Array
const toF32Array = (buf) => {
    const buffer = new ArrayBuffer(buf.length)
    const view = new Uint8Array(buffer)
    for (var i = 0; i < buf.length; i++) {
        view[i] = buf[i]
    }
    return new Float32Array(buffer)
}

const WavEncoder = require('wav-encoder')

// data: Float32Array
// sampleRate: number
// filename: string
const exportWAV = (data, sampleRate, filename) => {
    const audioData = {
        sampleRate: sampleRate,
        channelData: [data]
    }
    WavEncoder.encode(audioData).then((buffer) => {
        fs.writeFile(filename, Buffer.from(buffer), (e) => {
            if (e) {
                console.log(e)
            } else {
                console.log(`Successfully saved ${filename}`)
            }
        })
    })
}

