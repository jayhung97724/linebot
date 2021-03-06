const linebot = require('../index.js');
const assert = require('assert');
const crypto = require('crypto');
const fetch = require('node-fetch');

const bot = linebot({
	channelId: 1234567890,
	channelSecret: 'secret',
	channelAccessToken: 'token'
});

const req = {};
req.headers = {
	'Content-Type': 'application/json',
	Authorization: 'Bearer token',
	'X-Line-Signature': 'signature'
};
req.body = {
	events: [{
		replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
		type: 'message',
		timestamp: 1462629479859,
		source: {
			type: 'user',
			userId: 'U206d25c2ea6bd87c17655609a1c37cb8'
		},
		message: {
			id: '325708',
			type: 'text',
			text: 'Hello, world'
		}
	}]
};
req.rawBody = JSON.stringify(req.body);
req.headers['X-Line-Signature'] = crypto.createHmac('sha256', 'secret').update(req.rawBody, 'utf8').digest('base64');

describe('linebot', function () {
	describe('#constructor()', function () {
		it('should create a new LineBot instance.', function () {
			assert.equal(linebot.LineBot, bot.constructor);
		});
		it('should have options as specified.', function () {
			assert.equal(bot.options.verify, true);
		});
	});
	describe('#verify()', function () {
		it('should return true when the signature is correct.', function () {
			const res = bot.verify(req.rawBody, req.headers['X-Line-Signature']);
			assert.equal(res, true);
		});
		it('should return false when the signature is incorrect.', function () {
			const res = bot.verify(req.rawBody, 'random signature');
			assert.equal(res, false);
		});
	});
	describe('#parse()', function () {
		it('should raise message event.', function (done) {
			const localBot = linebot({});
			localBot.on('message', function (event) {
				assert.equal(event, req.body.events[0]);
				assert.equal(typeof event.reply, 'function');
				if (event.source) {
					assert.equal(typeof event.source.profile, 'function');
				}
				if (event.message) {
					assert.equal(typeof event.message.content, 'function');
				}
				done();
			});
			localBot.parse(req.body);
		});
	});
	describe('#reply()', function () {
		it('should return a promise.', function () {
			const res = bot.reply('reply token', 'message');
			assert.equal(Promise, res.constructor);
		});
		it('should not crash if message is missing.', function () {
			const res = bot.reply('reply token');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#push()', function () {
		it('should return a promise.', function () {
			const res = bot.push('to', 'message');
			assert.equal(Promise, res.constructor);
		});
		it('should resolve multiple promises.', function () {
			bot.push(['1', '2', '3'], 'message').then(function (results) {
				assert.equal(results.length, 3);
			});
		});
	});
	describe('#multicast()', function () {
		it('should return a promise.', function () {
			const res = bot.push(['to'], 'message');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#getUserProfile()', function () {
		it('should return a promise.', function () {
			const res = bot.getUserProfile('userId');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#getMessageContent()', function () {
		it('should return a promise.', function () {
			const res = bot.getMessageContent('messageId');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#leaveGroup()', function () {
		it('should return a promise.', function () {
			const res = bot.leaveGroup('groupId');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#leaveRoom()', function () {
		it('should return a promise.', function () {
			const res = bot.leaveRoom('roomId');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#get()', function () {
		it('should return a promise.', function () {
			const res = bot.get('a/random/path');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#post()', function () {
		it('should return a promise.', function () {
			const body = {
				head: 'This is the head of the body. Do you not like it?'
			};
			const res = bot.post('a/random/path', body);
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#parser()', function () {
		it('should return a function that expects 2 arguments.', function () {
			const parser = bot.parser();
			assert.equal(typeof parser, 'function');
			assert.equal(parser.length, 2);
		});
	});
	describe('#listen()', function () {
		it('should expect 3 arguments.', function () {
			assert.equal(typeof bot.listen, 'function');
			assert.equal(bot.listen.length, 3);
		});
		it('should start http server.', function (done) {
			bot.listen('/linewebhook', 3000, function () {
				done();
			});
		});
		it('should handle POST request and return empty object.', function (done) {
			fetch('http://localhost:3000/linewebhook', { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) }).then(function (res) {
				assert.equal(res.status, 200);
				return res.json();
			}).then(function (data) {
				assert.deepEqual(data, {});
				done();
			});
		});
	});
});
