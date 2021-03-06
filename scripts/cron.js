// Description:
//   指定した時間になったらつぶやく系
// Commands:
//   hubot 天気 - 明日の天気予報を表示
//   hubot 特売 - 今日の特売情報を表示
'use strict';

let sprintf = require('sprintf');
let cron = require('../lib/cron');
let getWeather = require('../lib/weather');
let date2sekki = require('../lib/date2sekki');
let Shukjitz = require('shukjitz');
let IRKit = require('irkit');
let signals = require('../config/irkit.json');
let Cookpad = require('../lib/cookpad');

const options = { room: process.env.SLACK_MAIN_CHANNEL };

const BARGAINS = [
  //{
  //  shop: '文化堂 戸越銀座店',
  //  url: 'https://cookpad.com/bargains/%E6%96%87%E5%8C%96%E5%A0%82/4114',
  //},
  {
    shop: 'オオゼキ 戸越公園店',
    url: 'https://cookpad.com/bargains/%E3%82%AA%E3%82%AA%E3%82%BC%E3%82%AD/8406',
  },
];

function weather2slackAttachment(weather) {
  var title = '明日の天気は ' + weather.emoji + ' です';
  var attachment = {
    fallback: title,
    title: title,
    fields: [
      { title: '最高気温', value: `${weather.max}℃ (${weather.diffMaxStr}℃)`, short: true },
      { title: '最低気温', value: `${weather.min}℃ (${weather.diffMinStr}℃)`, short: true },
    ],
  };
  if ( weather.weather.match(/雨/) ) {
    attachment.text = '傘を忘れないでください';
    attachment.color = '#439FE0';
  }
  return attachment;
}

module.exports = (robot) => {



  let shukjitz = new Shukjitz();
  let irkit = new IRKit();

  // 毎朝
  cron('0 30 7 * * *', () => {
    var attachment = {
      fallback: '朝ですよ',
      pretext: '朝ですよ',
      fields: [],
    };

    let today = new Date();

    // 日付
    let holiday = shukjitz.checkSync(today);
    attachment.title = sprintf('%02d月%02d日(%s%s)%s',
      today.getMonth() + 1,
      today.getDate(),
      '日月火水木金土'.charAt( today.getDay() ),
      holiday ? '祝' : '',
      holiday ? ` ${holiday}` : ''
    );

    // 二十四節気
    let sekki = date2sekki( today );
    if ( sekki ) {
      attachment.fields.push({ title: sekki[0] + ' (二十四節気)', value: sekki[1] + '〜' });
    }

    robot.emit('slack.attachment', { message: options, content: [ attachment ] });
  });

  // 7時半に照明を点ける / 9時半に照明を消す
  if ( irkit.available() ) {
    cron('0 30 7 * * *', () => irkit.send( signals.light.on ));
    cron('0 30 9 * * *', () => irkit.send( signals.light.off ));
  }

  cron('0 0 19 * * *', () => {
    robot.send(options, '19時ですよ');

    var bargains = BARGAINS[0];
    Cookpad.bargains(bargains.url).then((items) => {
      robot.emit('slack.attachment', {
        message: options,
        content: [
          {
            fallback: '今日の特売情報です',
            title: `今日の <${bargains.url}|${bargains.shop} の特売情報> です`,
            text: items.map((item) => `・ ${item.name} (${item.price}円)`).join("\n"),
          },
        ],
      });
    });
  });

  cron('0 0 22 * * *', () => {
    let tomorrow = new Date();
    tomorrow.setDate( tomorrow.getDate() + 1 );

    // ごみの日
    var trash = null;
    switch ( tomorrow.getDay() ) {
      case 3: // 水曜
      case 6: // 土曜
        trash = ':fire: 可燃ごみ';
        break;
      case 5: // 金曜
        trash = ':recycle: 資源ごみ';
        break;
      case 2: // 第１・第３火曜
        let n = Math.floor( ( tomorrow.getDate() - 1 ) / 7 ) + 1;
        if ( n === 1 || n === 3 ) {
          trash = ':battery: 不燃ごみ';
        }
        break;
    }
    if ( trash ) {
      let text = `明日は ${trash} の日です`;
      robot.emit('slack.attachment', {
        message: options,
        content: [{ fallback: text, title: text }],
      });
    }

    // 明日の天気
    getWeather().then((weather) => {
      robot.emit('slack.attachment', {
        message: options,
        content: [ weather2slackAttachment(weather) ],
      });
    });

  });

  // 明日の天気 (普通に呼び出す用)
  robot.respond(/天気/, (msg) => {
    getWeather().then((weather) => {
      robot.emit('slack.attachment', {
        message: msg.message,
        content: [ weather2slackAttachment(weather) ],
      });
    });
  });

  // 特売情報 (普通に呼び出す用)
  robot.respond(/特売$/i, (msg) => {
    var bargains = BARGAINS[0];
    Cookpad.bargains(bargains.url).then((items) => {
      robot.emit('slack.attachment', {
        message: msg.message,
        content: [
          {
            fallback: '今日の特売情報です',
            title: `今日の <${bargains.url}|${bargains.shop} の特売情報> です`,
            text: items.map((item) => `・ ${item.name} (${item.price}円)`).join("\n"),
          },
        ],
      });
    });
  });

};
