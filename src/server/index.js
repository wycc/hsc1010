const { createCanvas, loadImage } = require('canvas')
const express = require('express');
const querystring = require('querystring');
const os = require('os');
const http = require('http');
const https = require('https');
const Stream=require('stream').PassThrough;
const OAuth = require('oauth');
const qrcode=require('qrcode');
const util=require('util');

const fs = require('fs');
const exec = require('child_process').exec;
const app = express();
const dgram=require('dgram');
const ASK=1;
const REPLY=2;
// Commands
const ALARM=1;
const CANCELALARM=2;
const SENDMESSAGE=3;
const REPORTSTATUS=4;
const QUERYSTATUS=5;
const REMOTEDEFENSE=20;
const RESEYPASS=30;
const WRITEIDCARD=54;
const READIDCARD=55;
const BRUSHIDCARD=56;
const WRITEDOORACCESS=57;
const READDOORACCESS=58;
const CAPTUREPIC_SEND_START=60;
const CAPTUREPIC_SEND_DATA=61;
const CAPTUREPIC_SEND_SUCC=62;
const CAPTUREPIC_SEND_FAIL=63;
const VIDEOTALK=150;
const VIDEOWATCH=152;
const NSORDER=154;
const NSSERVERORDER=155
const IPCAM_WATCH=158;
const REMOTEFORTIFY=160;
const FINDEQUIP=170;
const OV7725_OPERATE=227;
const HOSTTOSUB=222;
const DOWNLOAD=224;
const UPLOADFILE=225;
const UPLOADYUV=227;
const READFLASH=228;
const REMOTERESET=229;
const UDP_TEST=245;
const SEARCHALLEQUIP=252;
const REMOTEDEBUGINFO=253;
const WRITEEQUIPADDR=254;

// Sub commands for HOSTOPSUB
const SYNCSUB=1;
const SUBDEFENCE=2;
const SUBALARM=3;
const SUBALARMTIP=5;
const SUBDEFENCETIP=6;
const SUBCONTROL=10;
const SUBCONTROLTIP=11;
const SUBFIND=255;

// sub commands for DOWNLOAD
const STARTDOWN=1;
const DOWN=2;
const DOWNFINISHONE=3;
const STOPDOWN=10;
const DOWNFAIL=21;


const TYPE_FIRMWARE=0;
const TYPE_JPEG=1;
const TYPE_QRCODE=10;
// sub commands for OV7725_OPERATE
const OV7725READREGISTER=1;
const OV7725WRITEREGISTER=2;

// sub command for VIDEOTALK
const CALL=1;
const LINEUSE=2;
const QUERYFAIL=3;
const CALLANSWER=4;
const CALLSTART=6;
const CALLUP=7;
const CALLDOWN=8;
const CALLCONFIRM=9;
const REMOTEOPENLOCK=10;
const CURSOR=15;
const CALLRELAY=16;
const CALLRELAYEND=17;
const JOINGROUP=22;
const LEAVEGROUP=23;
const TURNTALK=24;
const CENTRALTURN=25;
const TRUSTSHIPTALK=26;
const CALLEND=30;
const CALLAUDIOUP=40;
const CALLAUDIODOWN=41;
const DISABLELOCK=100;
const ENABLELOCK=101;

const PING_INTERVAL=2;

var JsonDB=require('node-json-db');
var db = new JsonDB('root',true,false);
var server = dgram.createSocket('udp4');
var g_list={};
var g_has_hsc48=false;

var weather_hi_temperature=0; 
var weather_lo_temperature=0; 
var weather_condition=['NA',255,255];
var watchdog_init=0;
var blink = 0;
var g_report_addr='';
var g_report_ip;
var g_report_mac='';
var line_bot_url_ch = 'https://line.me/R/ti/p/%40lew8703x';
var g_portal_ready = 0;
var g_phones='';
var apexx_domain='s.homescenario.com:hs';
var line_bot_url_en = 'https://line.me/R/ti/p/%40530raldg';
var line_bot_url = line_bot_url_ch;
setInterval(function() {
	exec("/home/ehome/home/net.sh");
}, 600*1000);
exec('/home/ehome/init_led.sh');
setTimeout(function() {
	setInterval(function() {
		blink = 1-blink;
		exec('echo '+blink+' > /sys/class/leds/orangepi:green:status/brightness');

	},500);
	setInterval(function() {
		var lang = db.getData('/lang');
		console.log('lang is '+lang);
		if (lang == 'en') {
			line_bot_url = line_bot_url_en;
		} else {
			line_bot_url = line_bot_url_ch;
		}
	},2000);
}, 40000);

app.use(express.static('dist'));
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/api/getUsername', (req, res) => res.send({ username: os.userInfo().username }));

var buildname=['A','B','C','D','E','F','G','H','I','J','K'];
function ChangeID(id,papip)
{
	console.log('refresh freeswitch.....');
	//exec("rm -rf /usr/local/freeswitch/conf/directory/default/*");
	//exec("rm -rf /usr/local/freeswitch/conf/dialplan/user/*");
	var addr = db.getData('/roomID');
	var pass='1234';
	var sipid = id;
	var temp = fs.readFileSync('user.tmp').toString();
	//console.log(addr);
	if (addr == undefined)
		addr = '00010136090';
	temp = temp.split('$$addr').join(addr);
	temp = temp.split('$$pass').join(pass);
	fs.writeFile('/usr/local/freeswitch/conf/directory/default/'+addr+'.xml', temp,(err)=> {
		if (err) throw err;
		console.log('file is updated');
	});

	var temp = fs.readFileSync('sip.tmp').toString();
	var name = '';
	var fl = addr.substr(0,6);
	var build,floor,unit;
	if (fl.substr(0,5) == '00010') {
		try {
			build = buildname[parseInt(fl[5])];
		} catch(e) {
			build = 'Build #'+parseInt(fl[5]);
		}
		floor = parseInt(addr.substr(6,2));
		unit = parseInt(addr.substr(8,2));

	} else {
		try {
			build = buildname[parseInt(fl[3])];
		} catch(e) {
			build = 'Build #'+parseInt(fl[5]);
		}
		floor = parseInt(addr.substr(6,2));
		unit = parseInt(addr.substr(8,2));
	}
	name = build+unit+'-'+floor+'F';

	temp = temp.split('$$addr').join(addr);
	temp = temp.split('$$pass').join(pass);
	temp = temp.split('$$sipid').join(sipid);
	temp = temp.split('$$papip').join(papip);
	temp = temp.split('$$name').join(name);
	fs.writeFile('/usr/local/freeswitch/conf/dialplan/user/'+addr+'.xml', temp, (err) => {
		console.log('diaplan is updated');
		if (err) console.log(err);
		exec('killall freeswitch lt-freeswitch')
	});

	console.log('refresh freeswitch.....done');
}

function Network_Fetch(cb)
{
	var cfg = {};
	var lines = fs.readFileSync('/etc/net.txt').toString().split('\n');
	var i;
	cfg['networkdetect'] = 1;

	for(i=0;i<lines.length;i++) {
		var ff = lines[i].split('=');
		if (ff.length >= 2) {
			var key = ff[0];
			var value = ff[1].trim();
			//console.log('key is '+ key);
			if (key == 'IP') {
				cfg['ip'] = value;
			} else if (key == 'MASK') {
				cfg['mask'] = value;
			} else if (key == 'GATEWAY') {
				cfg['gateway'] = value;
			} else if (key == 'DNS') {
				cfg['dns'] = value;
			} else if (key == 'PORT') {
				cfg['sshport'] = value;
			} else if (key == 'DETECT') {
				cfg['networkdetect'] = value;
			}
		}
	}
	cb(cfg);
}

function Network_Set(ip,mask,gateway,sshport,networkdetect)
{
	var temp = '';

	temp = temp + 'IP='+ip+'\n';
	temp = temp + 'MASK='+mask+'\n';
	temp = temp + 'GATEWAY='+gateway+'\n';
	temp = temp + 'DNS=168.95.1.1\n';
	temp = temp + 'PORT='+sshport+'\n';
	temp = temp + 'DETECT='+networkdetect+'\n';
	fs.writeFileSync('/etc/net.txt',temp);
	setTimeout(function() {
		exec("/home/ehome/home/restart.sh");
	},5000);
}

app.get('/api/phones',(req,res)=> {
	res.write(JSON.stringify(g_phones));
	res.end();
});

app.get('/api/portal_status',(req,res)=> {
	res.write(JSON.stringify(g_portal_ready));
	res.end();
});
app.get('/api/db',(req,res) => {
	var name = req.query.name;
	var cmd = req.query.cmd;

	if (cmd == 'get') {
		try {
			var cc = db.getData(name);
			//console.log(cc);
			res.write(JSON.stringify(db.getData(name)));
			res.end();
		} catch(e) {
			res.write('[]');
			res.end()
		}
	} else if (cmd == 'set') {
		console.log('set '+name+' to be '+req.query.value);
		db.push(name, req.query.value,true);
		if (name == '/sipID') {
			ChangeID(req.query.value,db.getData('/papip'));
		} else if (name == '/papip') {
			ChangeID(db.getData('/sipID'),req.query.value);
		}
		res.write('ok');
		res.end();
	}
});
app.get('/api/shutdown', function(req,res,next) {
	res.write('ok')
	res.end();
	setTimeout(function() {
		exec("systemctl stop freeswitch",function(error,stdout,stderr) {
			exec("sync;halt");
		});
	}, 500);
});
app.get('/api/enable_sip', function(req,res,next) {
	Network_Fetch(function(cfg) {
		var ip = g_report_ip;
		exec("/usr/bin/util_8130 "+ip+" message \"change system setting sip_server="+cfg['ip']+"\"",function(err, stdout,stderr) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
				return;
			}
			res.write('ok');
			res.end();
		});
	});
});
app.get('/api/enable_line', function(req,res,next) {
	Network_Fetch(function(cfg) {
		var ip = g_report_ip;
		exec("/usr/bin/util_8130 "+ip+" message \"change system setting ehome=32\"",function(err, stdout,stderr) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
				return;
			}
			res.write('ok');
			res.end();
		});
	});
});

app.get('/api/disable_sip', function(req,res,next) {
	Network_Fetch(function(cfg) {
		var ip = g_report_ip;
		exec("/usr/bin/util_8130 "+ip+" message \"change system setting sip_server=0.0.0.0\"",function(err, stdout,stderr) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
				return;
			}
			res.write('ok');
			res.end();
		});
	});
});
app.get('/api/disable_line', function(req,res,next) {
	Network_Fetch(function(cfg) {
		var ip = g_report_ip;
		exec("/usr/bin/util_8130 "+ip+" message \"change system setting ehome=0\"",function(err, stdout,stderr) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
				return;
			}
			res.write('ok');
			res.end();
		});
	});
});

app.get('/api/reset_push', function(req,res,next) {
	Network_Fetch(function(cfg) {
		var ip = g_report_ip;
		exec("rm /home/ehome/export/var/secret/homeserver_state.json /home/ehome/export/var/secret/homeserver/uuid.txt; systemctl restart homeserver ",function(err, stdout,stderr) {
			if (err) {
				res.write(JSON.stringify(err));
				res.end();
				return;
			}
			res.write('ok');
			res.end();
		});
	});
});



app.get('/api/hsc48_set', function(req,res,next) {
	var addr = req.query.addr;
	var ip = req.query.ip;
	var data = 'MODE=Standalone\nROOM='+addr.substr(0,11)+'7\nPORTAL=\n';
	var options = {
		hostname: ip,
		path:'/cgi-bin/file?save=mode.txt',
		port:80,
		timeout:200,
		method:'POST',
		headers: {
			'Content-Type':'application/x-www-form-urlencoded',
			'Content-Length': data.length
		}
	};
	var req = http.request(options, r => {
		var data = '';
		r.on('data',(d) => {
			console.log(d);
			data = data + d;
		});
		r.on('end',() => {
			console.log(data);
			res.write('ok');
			res.end();
		});
	});
	req.on('error', (error) => {
		res.write(JSON.stringify(error));
		res.end();
	});
	req.write(data);
	req.end();
});

app.get('/api/qrcode_img',function(req,res,next) {
	var p = req.query.number;
	var fname = '/tmp/'+(new Date()).getTime()+".jpg";
	var url = 'http://portal.homescenario.com/portal/poll/sip3?number='+p;
				
	qrcode.toFile(fname,url,function() {
		res.writeHead(200,{"Content-Type":" image/jpg"});
		fs.readFile(fname,
	            function (err, content) {
        	        // Serving the image
                	res.end(content);
		    }
		);
	});
});
app.get('/api/qrcode', function(req,res,next) {
	http.get('http://127.0.0.1:1780/ins/qrcode?room_id='+req.query.roomid+'&w=200&data=%7B%22passcode%22%3A%22'+req.query.passcode+'%22%2C%22serialno%22%3A%22'+req.query.serialno+'%22%2C%22sipID%22%3A%22'+req.query.sipID+'%22%7D', function(r) {
		var data = new Stream();
		r.on('data', function(chunk) {
			console.log(data);
			console.log(data.write);
			data.write(chunk);
		});
		r.on('end',function() {
			res.write(data.read());
			res.end();
		});
		
	}).on('error',function()  {
		res.end();
	});
});
app.get('/api/list',function(req,res,next) {
	res.write(JSON.stringify(g_list));
	res.end();
});
app.get('/api/report_addr',function(req,res,next) {
	res.write(g_report_addr);
	res.end();
});
app.get('/api/setid',function(req,res,next) {
	var addr = req.query.addr;
	var code = Math.round(Math.random() * 10000000000) % 1000000;

	var mac;
	var mac_list = Object.keys(g_list);
	var i;
	var gat_addr = 'S'+addr.substr(0,10)+'7';
	var indoor_addr = 'S'+addr.substr(0,10)+'0';

	for(i=0;i<mac_list.length;i++) {
		mac = mac_list[i];
		console.log(gat_addr+' <<<>>> '+ g_list[mac].addr);
		if (g_list[mac].addr == gat_addr) {
			break;
		}
		if (g_list[mac].addr == indoor_addr) {
			break;
		}
	}
	if (i == mac_list.length) {
		res.write(('Gateway is not available'));
		res.end();
		return;
	}

	var url = 'http://127.0.0.1:1780/ins/setid?room=' + addr + '&regid=' + code + '&passcode=1234&serialno='+mac;

	http.get(url, function (r) { 
		var data = '';
		r.on('data', function (chunk) {
			data = data + chunk;
		});
		r.on('end', function () {
			console.log(data);
			res.write(code + '');
			res.end();
		});
	});
});
app.get('/api/net',function(req,res,next) {
	var cmd = req.query.cmd;
	if (cmd == 'get') {
		Network_Fetch(function(cfg) {
			res.write(JSON.stringify(cfg));
			res.end();
		});
		return;
	} else if (cmd == 'set') {
		res.write('ok');
		res.end();
		Network_Set(req.query.ip, req.query.mask,req.query.gateway,req.query.sshport,req.query.networkdetect);
		return;
	}

	res.write('unknown cmd');
	res.end();
});
app.get('/api/lang',function(req,res,next) {
	var cmd = req.query.cmd;
	if (cmd == 'get') {
		try {
			var lang = db.getData('/lang');
			console.log('languages is '+ lang);
			res.write(lang);
			res.end();
		} catch(e) {
			res.write('');
			res.end();
		}

	} else if (cmd == 'set') {
		console.log('languages is set to be '+ req.query.value);

		db.push('/lang', req.query.value,true);
		res.write('ok');
		res.end();
	} else {
		res.write('cmd '+cmd +'  is not defined for /api/lang');
		res.end();
	}
});

app.get('/api/sendmessage',function(req,res,next) {
	console.log(`title is ${req.query.title}`);
	console.log(`message is ${req.query.message}`);
	var addr = req.query.addr;
	var params = {kind: 'attention', room:addr, title: req.query.title, body: req.query.message};
	var postData = querystring.stringify(params);
	console.log(postData);
	var options = {
		hostname:'127.0.0.1',
		port:1780,
		path:'/ins/send_message?'+postData,
		method:'GET',
		timeout:200,
		//headers: {
		//	'Content-Type':'application/x-www-form-urlencodded',
		//	'Content-Length': Buffer.byteLength(postData)
		//}
	};
	var rr = http.request(options,function(r) {
		console.log(r.statusCode);
		if (r.statusCode != 200) {
			console.log(r);
			res.send('fail');
			res.end();
			return;
		}
		let data='';
		r.on('data', (chunk) => {data = data + chunk;});
		r.on('end', () => {
			console.log('------------------> done');
			console.log(data);
			res.send(data);
			res.end();
		});
	});

	rr.on('error', (e) => {
		res.send(e);
		res.end();
	});
	rr.write(postData);
	rr.end();
});


app.listen(('127.0.0.1',8080), () => console.log('Listening on port 8080!'));


server.on('message', (msg,rinfo) => {
	handle_message(msg,rinfo);
});

server.on('error',(err) => {
});	

server.on('listening',()=>{
	var address = server.address();
	server.setBroadcast(true);
	try {
		server.addMembership('238.9.9.1');
	} catch (e) {
	}

});

server.bind(8500);


function intercom_recv_hosttosub(msg,rinfo)
{
	var roomaddr = msg.slice(33,53).toString('ascii');
	var roomip = `${msg[29]}.${msg[30]}.${msg[31]}.${msg[32]}`;
	//console.log('host to sub station '+roomaddr+' roomip='+roomip);
	if (roomaddr[11] != '0') {
		Object.keys(g_list).map(function(k) {
			var c = g_list[k];
			if (c.addr == roomaddr.substr(0,11)+'0') {
				g_list[k].IP = roomip;
			}
		});
	}
}

function intercom_set_arm(addr,mac,v)
{
	var b = new Buffer(63);
	b[0] = 88;
	b[1] = 88;
	b[2] = 88;
	b[3] = 67;
	b[4] = 73;
	b[5] = 68;
	b[6] = REMOTEFORTIFY;
	b[7] = 1;
	b[8] = SUBDEFENCE;
	var i;
	var IP=g_list[mac].IP;
	console.log('send to IP '+IP+' addr='+addr+' mac='+mac);
	console.log(g_list);
	if (IP == undefined) return;
	var ip = IP.split(".").map(function(v) {return parseInt(v,10);});

	for(i=9;i<9+addr.length;i++)
		b[i] = 0;
	for(;i<29;i++)
		b[i] = 0;
	for(i=29;i<33;i++)
		b[i] = 0;
	for(i=33;i<33+addr.length;i++)
		b[i] = addr.charCodeAt(i-33);
	for(i=53;i<57;i++)
		b[i] = ip[i-53];
	b[62] = (v&1)?5:4;
	console.log('xxxxxxxxxxxxxxxxxxxxxxx');
	console.log(b);
	server.send(b,0,b.length,8302,IP);
}

function portal_do_cmd(addr,mac,data)
{
	var i=2;

	var com=null;
	var mac;
	var addr = db.getData('/roomID');
	var now = (new Date()).getTime();
	var new_list = {};
       	Object.keys(g_list).map(function(m) {
		var c = g_list[m];
		//console.log(c);
		//console.log(c.addr[0]+' '+c.addr[11]);
		if ((c.addr[0] == 'S') && (c.addr.substr(1)==addr)) {
			com = c;
			mac = m;
		}
		if (now-c.time < 60*1000) {
			new_list[m] = c;
		}
	});
	for(i=2;i<data.length;i+=6) {
		var p = parseInt(data.substr(i,2),16);
		var d = parseInt(data.substr(i+2,2),16);
		var v = parseInt(data.substr(i+4,2),16);
		console.log("d="+d+" p="+p+" v="+v);
		if (d == 0xe0 && p == 0) {
			intercom_set_arm(com.addr,mac,v);
		}
	}
}

function portal_report(mac,addr,st,num,cb)
{
	console.log("status="+st+" addr="+addr+" num="+num+" mac="+mac+ " ");
	var url;
	if (st) {
		url = '/portal/poll/notifyst?serialno='+mac+'&arm='+st+'&force=y'
	} else {
		url = '/portal/poll/notifyst?serialno='+mac+'&force=y'
	}

	var options = {
		hostname: 'portal.homescenario.com',
		path: url,
		port:80,
		timeout:200,
		method:'GET'
	};
	var req = http.request(options, r => {
		var data = '';
		r.on('data',(d) => {
			data = data + d;
		});
		r.on('end',() => {
			console.log("\033[41m;"+data+"\033[m");
			try {
				portal_do_cmd(addr,mac,data);
			} catch(e) {
			}
			cb('ok');
		});
	});
	req.on('error', (error) => {
		if (error)
			console.log(error);
		cb('error');
	});
	req.end();
}

function intercom_recv_report_status(msg,rinfo)
{
	var roomaddr = msg.slice(8,20).toString('ascii');
	var mac = msg.slice(28, 28 + 6).toString('hex');
	var roomip = `${msg[136]}.${msg[137]}.${msg[138]}.${msg[139]}`;
	//var roomip = rinfo.address;

	//msg[7] = REPLY;
	//server.send(msg,0,msg.length, 8300,rinfo.address);
	//console.log(msg);
	//console.log('station '+roomaddr+' report mac='+mac+'roomip='+roomip);
	if (g_list.hasOwnProperty(mac) == false) {
		g_list[mac] = new Object();
	}
	g_list[mac].time = (new Date()).getTime();
	g_list[mac].live = true;
	if (msg[136] == 192)
		g_list[mac].IP = roomip;
	g_list[mac].addr = roomaddr;

	if (roomaddr[11] == '7') {
		g_has_hsc48 = true;
		g_hsc48_ip = roomip;
	}

	if (g_has_hsc48 == false) {
		//console.log(msg);
		if (roomaddr[0] == 'S' && roomaddr[11] == '0') {
			//portal_report(mac, roomaddr, msg[34],msg[35]);
			var arm;
			if (msg[34] == 0)
				arm = "normal";
			else if (msg[34] == 1)
				arm = "arm";
			else if (msg[34] == 2)
				arm = "home";
			else
				arm ="delay";
			g_list[mac].st = arm;
			g_list[mac].num = msg[35];
		}
	} else {
		if (roomaddr[0] == 'S' && roomaddr[11] == '0') {
			return;
			var arm;
			if (msg[34] == 0)
				arm = "normal";
			else if (msg[34] == 1)
				arm = "arm";
			else if (msg[34] == 2)
				arm = "home";
			else
				arm ="delay";
			g_list[mac].st = arm;
			g_list[mac].num = msg[35];
			var arg;
			if (arm == "normal")
				arg= (0<<16) | (0xe0<<8);
			else
				arg= (1<<16) | (0xe0<<8);
			var options = {
				hostname: g_hsc48_ip,
				path:'/cgi-bin/proxy?cmd=/r'+arg+',0',
				port:80,
				timeout:200,
				method:'GET'
			};
			var req = http.request(options, r => {
				var data = '';
				r.on('data',(d) => {
					data = data + d;
				});
				r.on('end',() => {
					console.log("\033[41m;"+data+"\033[m");
				});
			});
			req.on('error', (error) => {
				if (error)
					console.log(error);
			});
			req.end();
			console.log('sync to cgidaemon arm='+arm);
		}
	}

}

function alarm_to_str(alarm)
{
	var i;
	var sss='';
	console.log('alarm='+alarm);

	for(i=0;i<8;i++) {
		if (alarm & (1<<i)) {
			//sss = sss + "Zone " + (i+1);
			sss = sss + "防區 " + (i+1);
		}
	}
	return sss;
}

function intercom_recv_alarm(msg,rinfo)
{
	var addr = msg.slice(9,20).toString('ascii');
	var alarm = msg[37] | (msg[38]<<8);
	//var alarm_msg = ('Receive Message')+' '+alarm_to_str(alarm);
	//var params = {kind: 'attention', room:addr, title: 'Alarm', body: alarm_msg};
	var alarm_msg = ('收到報警')+' '+alarm_to_str(alarm);
	var params = {kind: 'attention', room:addr, title: '報警', body: alarm_msg};
	var postData = querystring.stringify(params);
	console.log(postData);
	var options = {
		hostname:'127.0.0.1',
		port:1780,
		path:'/ins/send_message?'+postData,
		method:'GET',
		timeout:200,
		//headers: {
		//	'Content-Type':'application/x-www-form-urlencodded',
		//	'Content-Length': Buffer.byteLength(postData)
		//}
	};
	var rr = http.request(options,function(r) {
		console.log(r.statusCode);
		if (r.statusCode != 200) {
			console.log(r);
			return;
		}
		let data='';
		r.on('data', (chunk) => {data = data + chunk;});
		r.on('end', () => {
			console.log('------------------> done');
			console.log(data);
		});
	});

	rr.on('error', (e) => {
		console.log(e);
	});
	console.log('sent');
	rr.write(postData);
	rr.end();

}
function toAddress(msg)
{
	var i;
	var s='';
	for(i=0;i<msg.length;i++) {
		if (msg[i]==0) break;
	}
	return msg.slice(0,i).toString('ascii');
}

function send_linphone_video()
{
	console.log('send linephone video');
	g_send_video_timeout--;
	if (g_send_video_timeout <= 0) {
		clearTimeout(g_linephone_timer);
	}
	data = g_linephone_qrcode_data;
	if (data == null) return;
	var i;

	for(i=data.length-1;i>=0;i--) {
		if (data[i-1] == 0xff && data[i] == 0xd9) break;
	}
	data = data.slice(0,i+1);

	// output a picture to 8302 port by using intercom_send_video
	if (data[data.length-1] != 0xd9 || data[data.length-2] != 0xff) {
		console.log('drop incorrect frame');	
		return;
	}

	var i,no;
	/*
	for(i=0;i<data.length;i++) {
		if (data[i] == 0xff && data[i+1] == 0xda)
			break;
	}
	data = data.slice(i);
	*/
	var num_pack = Math.floor((data.length+1199)/1200);
	console.log('output a picture len='+data.length+' num='+num_pack);
	for(no=0;no<num_pack;no++) {
		var b = new Buffer(86+1200);
		//var b = obj.buffer;
		b[0] = 88; b[1] = 88; b[2] = 88; b[3] = 67; b[4] = 73; b[5] = 68;
		b[6] = IPCAM_WATCH;
		b[7] = 0x80 | 1;
		b[8] = CALLDOWN;
		var addr = 'P9992';
		for(i=0;i<addr.length;i++)
			b[9+i] = addr.charCodeAt(i);
		for(;i<20;i++)
			b[9+i] = 0;
		var ips = g_linphone_targetip.split('.');
		for(i=0;i<4;i++)
			b[29+i] = parseInt(ips[i]);
		var myaddr = g_linphone_targetaddr;
		for(i=0;i<myaddr.length;i++)
			b[33+i] = myaddr.charCodeAt(i);
		for(;i<20;i++)
			b[33+i] = 0;
		ips = '192.168.68.1';
		for(i=0;i<4;i++)
			b[53+i] = parseInt(ips[i]);
		var t = (new Date()).getTime();
		b[57]=(t)&0xff;
		b[58]=(t>>8)&0xff;
		b[59]=(t>>16)&0xff;
		b[60]=(t>>24)&0xff;

		b[61] = 2;
		b[62] = 0;

		b[63] = g_frameno&0xff;
		b[64] = g_frameno>>8;

		b[65] = data.length&0xff; 
		b[66] = data.length>>8;

		b[67] = 0;
		b[68] = 0;

		b[69] = Math.floor((data.length+1199)/1200);
		b[70] = 0;

		b[71] = no+1;
		b[72] = 0;
		
		b[75] = 1200&0xff;
		b[76] = 1200>>8;

		b[77] = 50;
		b[78] = 0;

		b[79] = 10;
		b[80] = 0;
		//pac length
		if (no == num_pack-1)
			len = data.length % 1200;
		else
			len = 1200;
		b[73] = len&0xff;
		b[74] = len>>8;
		//console.log('send video chunk len='+len+' to '+g_linphone_targetip);
		data.copy(b,86,no*1200,no*1200+len);
		server.send(b,0,b.length, 8302, g_linphone_targetip);
	}
	g_frameno = g_frameno + 1;
}

g_linephone_timer=0;
g_linephone_num=0;
g_linephone_qrcode_data=null;

function produce_linphone_video(data)
{
	const canvas = createCanvas(640, 480);
	const ctx = canvas.getContext('2d');
	ctx.font = '40px Arial';
	//ctx.rotate(0.1);
	ctx.drawImage(data, 400, 50)
	const out = fs.createWriteStream('/tmp/ss.jpg');
	const stream = canvas.createJPEGStream();
	var i;
	var phones = g_phones.split(',');
	console.log('XXXX');
	console.log(phones);
	for(i=0;i<phones.length;i++) {
		if (i != g_linephone_num) {
			ctx.fillStyle = '#FFF'
		} else {
			ctx.fillStyle = '#F00'
		}
		ctx.fillText(phones[i],0,i*80+80);
	}
	stream.pipe(out);
	out.on('finish', () => {
		cmd = "djpeg -bmp /tmp/ss.jpg| cjpeg > /tmp/qq.jpg";
		exec(cmd,function(error,stout,sterr) {
			console.log(cmd+'--->'+stout);
			g_linephone_qrcode_data = fs.readFileSync('/tmp/qq.jpg');
		});

	});

}


function update_video_screen(src_addr,ip)
{
	g_send_video_timeout=100;
	var fname='/tmp/oo.png';
	if (g_phones=='') {
		return;
	}
	console.log('-------------');
	console.log(g_phones);
	var phones = g_phones.split(',');
	console.log(phones);
	var url = 'http://portal.homescenario.com/portal/poll/sip3?number='+phones[g_linephone_num];
	g_linephopne_qrcode_data = null;
	g_linphone_targetaddr = src_addr;
	g_linphone_targetip = ip;
	g_frameno = 0;
	options = {width:200, height:200, margin:1};
	qrcode.toFile(fname,url, options,function() {
		loadImage(fname).then((image) => {
			produce_linphone_video(image);
		});
	});
	if (g_linephone_timer != 0) {
		clearInterval(g_linephone_timer);
	}
	send_linphone_video();
	clearTimeout(g_linephone_timer);
	g_linephone_timer = setInterval(send_linphone_video,1000);
}

function check_cursor(x,y)
{
	var i;
	if (g_phones=='') return;
	var phones = g_phones.split(',');

	if (x > 400) return;
	y -= 20;
	if (y<0) return;
	var l = y/80;
	console.log('l='+l);
	if (l >= phones.length) {
		return;
	}
	g_linephone_num = Math.round(l);
	console.log("g_linephone_num="+g_linephone_num);
}

function intercom_ipcam_watch(msg,rinfo)
{
	var op = msg[7]&3;
	var arg = msg[8];
	var src_addr = msg.slice(9,21).toString('ascii');
	var ip = `${msg[29]}.${msg[30]}.${msg[31]}.${msg[32]}`;
	var addr = msg.slice(33,38).toString('ascii');
	if (addr[0] == 'S')
		addr =msg.slice(33,45).toString('ascii');
	console.log('\033[41mop='+arg+' from '+ip+'\33[m');
	//console.log(msg);
	//console.log(addr);
	if (ip == '0.0.0.0') return;
	if (arg == CALL) {
		console.log('\033[41m;=================> send ack back\033[m\n');
		msg[7] = 0x90 | ASK;
		msg[8] = CALLANSWER;
		server.send(msg,0,msg.length, 8302, ip);
		update_video_screen(src_addr,ip);
	} else if (arg == CALLCONFIRM) {
		msg[7] = 0x90 | REPLY;
		server.send(msg,0,msg.length, 8302, ip);
	} else if (arg == CALLUP || arg == CALLDOWN) {
		console.log('\033[41m;get media data\033[m;\n');
	} else if (arg == CURSOR) {
		msg[7] = 0x90 | REPLY;
		server.send(msg,0,msg.length, 8302, ip);
		var x = msg[57]+msg[58]*256;
		var y = msg[59]+msg[60]*256;
		var ser = msg[61]+msg[62]*256;
		console.log('\033[41mcursor '+x+' '+y+' \033[m;\n');
		check_cursor(x,y);
		update_video_screen(src_addr,ip);
	} else if (arg == CALLEND) {
		console.log('>>>>>>>>>>>>>>>>>>>>>>terminal session')
		msg[7] = 0x90 | REPLY;
		server.send(msg,0,msg.length, 8302, ip);
		clearTimeout(g_linephone_timer);
	}

}

function intercom_nsorder(msg,rinfo)
{
	roomaddr = toAddress(msg.slice(8,20));
	roomip = `${msg[28]}.${msg[29]}.${msg[30]}.${msg[31]}`
	roomaddr2 = toAddress(msg.slice(32,44));
	roomip2 = `${msg[52]}.${msg[53]}.${msg[54]}.${msg[55]}`
	console.log('addr order '+roomaddr2);
	if (roomaddr2.slice(0,5) == 'P9992') {
		var b = new Buffer(1024);
		b.fill(0);
		console.log(msg);
		msg.slice(0,32).copy(b);
		b[7] = 0x80 | 2;
		b[32] = 1;

		b[33] = 'P'.charCodeAt(0);
		b[34] = '9'.charCodeAt(0);
		b[35] = '9'.charCodeAt(0);
		b[36] = '9'.charCodeAt(0);
		b[37] = '2'.charCodeAt(0);
		b[38] = 0;
		b[53] = 192;
		b[54] = 168;
		b[55] = 68;
		b[56] = 1;
		server.send(b,0,b.length, 8300, roomip);
		console.log('end to '+roomip);
	}
}

function handle_message(msg,rinfo)
{
	if (msg[0] == 88 && msg[1] == 88 && msg[2] ==88 && msg[3] ==67 && msg[4]==73 && msg[5] == 68) {
		var cmd = msg[6];
		var op = msg[7];
		var arg = msg[8];

		//console.log('cmd='+cmd+' op='+op+' arg='+arg+' '+JSON.stringify(rinfo));
		//console.log(msg);

		if ( cmd == REPORTSTATUS) {
			intercom_recv_report_status(msg,rinfo);

		} else if (cmd == NSORDER) {
			intercom_nsorder(msg,rinfo);
		} else if (cmd == NSSERVERORDER) {
			intercom_nsorder(msg,rinfo);
		} else if (cmd == IPCAM_WATCH ) {
			intercom_ipcam_watch(msg,rinfo);
		} else if (cmd == ALARM) {
			intercom_recv_alarm(msg,rinfo);
		} else if (cmd == HOSTTOSUB) {
			intercom_recv_hosttosub(msg,rinfo);
		} else if (cmd == UPLOADFILE) {
			intercom_recv_uploadfile(msg,rinfo);
		} else if (cmd == SEARCHALLEQUIP) {
			intercom_recv_searchallequip(msg,rinfo);

		} else {
			//console.log('cmd='+cmd+' op='+op+' arg='+arg);
		}

	}
}
function errormsg(m)
{
	console.log('\033[31m;'+m+'\033[m');
}

function intercom_recv_searchallequip(msg,rinfo)
{
	var op = msg[7]&3;
	if (op == 2) {
		var addr = msg.slice(10,10+11).toString();
		var mac = msg.slice(30, 30 + 6).toString('hex');
		var ip = msg[36]+'.'+msg[37]+'.'+msg[38]+'.'+msg[39];
		//console.log('recv search all ack '+mac+'---->'+ip);
		try {
			g_list[mac].IP = ip;
		} catch(e) {}
	}
}

function intercom_recv_uploadfile(msg,rinfo)
{
	var op = msg[7]&3;

	if (op == 1) {
		var addr = msg.slice(10,10+11).toString();
		var ip = msg[29]+'.'+msg[30]+'.'+msg[31]+'.'+msg[32];
		var file = msg.slice(33,33+8).toString();
		if (file == 'pass.txt') {
			var code = Math.round(Math.random() * 10000000000) % 1000000;
			var mac;
			var mac_list = Object.keys(g_list);
			var i;
			var gat_addr = 'S'+addr.substr(0,10)+'7';
			var indoor_addr = 'S'+addr.substr(0,10)+'0';

			for(i=0;i<mac_list.length;i++) {
				mac = mac_list[i];
				console.log(gat_addr+' <<<>>> '+ g_list[mac].addr);
				if (g_list[mac].addr == gat_addr) {
					break;
				}
			}
			if (i == mac_list.length) {
				for(i=0;i<mac_list.length;i++) {
					mac = mac_list[i];
					console.log(indoor_addr+' <<<>>> '+ g_list[mac].addr);
					if (g_list[mac].addr == indoor_addr) {
						break;
					}
				}
			}
			if (i == mac_list.length) {
				errormsg('can not find the indoor statrion or gateway yet addr='+addr);
				return;
			}

			var url = 'http://127.0.0.1:1780/ins/setid?room=' + addr + '&regid=' + code + '&passcode=1234&serialno='+mac;

			http.get(url, function(r) {
				var data = new Stream();
				r.on('data', function(chunk) {
					data.push(chunk);
				});
				r.on('end',function() {
					console.log(data.read());
					if (code < 10) {
						code = util.format("qr00000%d.jpg",code);
					} else if ( code < 100)  {
						code = util.format("qr0000%d.jpg",code);
					} else if ( code < 1000) {
						code = util.format("qr000%d.jpg",code);
					} else if ( code < 10000) {
						code = util.format("qr00%d.jpg",code);
					} else if ( code < 100000) {
						code = util.format("qr0%d.jpg",code);
					} else {
						code = util.format("qr%d.jpg",code);
					}
					var fname = '/tmp/'+(new Date()).getTime()+".jpg";
					
					qrcode.toFile(fname,line_bot_url,function() {
						cmd = "ls -l /tmp;convert -resize 128x128 "+fname+" /tmp/qq.jpg";
						exec(cmd,function(error,stout,sterr) {
							console.log(cmd+"--->"+stout);
							cmd = "djpeg -bmp /tmp/qq.jpg| cjpeg > "+code;
							exec(cmd,function(error,stout,sterr) {
								console.log(cmd+'--->'+stout);
								exec("/home/ehome/spi_flash_bcb/util_8130 "+ ip+" upload "+code, function(error,stout,sterr) {
									console.log(stout);
								});
							});
						});
					});
				});

			}).on('error',function(e) {
				console.log(e);
				return;
			});
		}
	}
}

function weather_update()
{
	var url = 'http://portal.homescenario.com/weather/0.txt';
	http.get(url, function(r) {
		var data = new Stream();
		r.on('data', function(chunk) {
			data.push(chunk);
		});
		r.on('end',function() {
			var ret = data.read().toString('utf-8');
			console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
			console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
			console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
			console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
			console.log(ret);
			var forcast = ret.split(',');
			weather_condition = weather_translate(forcast[0], '');
			weather_lo_temperature = forcast[1];
			weather_hi_temperature = forcast[2];

		});
	}).on('error',function(e) {
	});

}

function weather_update_old()
{
        var header = {
                "Yahoo-App-Id": "WIAM694o"
        };
        var request = new OAuth.OAuth(
                        null,
                        null,
                        "dj0yJmk9WlE5cmE0N2VaMFp0JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWYx",
                        "fd33290af931d322eecb84d31075555be564cc62",
                        '1.0',
                        null,
                        'HMAC-SHA1',
                        null,
                        header
        );
        request.get(
                        'https://weather-ydn-yql.media.yahoo.com/forecastrss?location=taipei&format=json',
                        null,
                        null,
                        function (err, data, result) {
                                if (err) {
                                        console.log(err);
                                } else {
                                        console.log(JSON.parse(data));
                                        var forecast = JSON.parse(data).forecasts[0];
                                        weather_hi_temperature = forecast.high;
                                        weather_lo_temperature = forecast.low;
                                        weather_condition = weather_translate(forecast.code,forecast.text);
                                        console.log([weather_hi_temperature,weather_lo_temperature,weather_condition[0],weather_condition[1]]);
					search_all_equip();
                                }
                        }
                   );

}
 
function _(m) {
	return m;
}

function weather_translate(code,text) 
{ 
        if (code== 26 || code == 29 || code == 30) { 
                return [_("Cloudly"),1,1]; 
        } else if (code == 27 || code == 28) { 
                return [_("Mostly cloudy"),3,3]; 
        } else if (code ==3 || code == 4 || code == 47) { 
                return [_("Thunderstorms"),5,5]; 
        } else if (code == 11 || code == 12) { 
                return [_("Showers"),44,4]; 
        } else if (code == 39) { 
                return [_("Scattered thunderstorms"),6,2]; 
        } else if (code == 32) { 
                return [_("Sunny"),2,0]; 
        } else { 
                return [text,code,0]; 
        } 
} 

function query_all_equip()
{
	//exec("/usr/bin/watchdog kick");
	Network_Fetch(function(cfg) {

		Object.keys(g_list).map(function(m) {
			var IP = g_list[m].IP;
			var addr = g_list[m].addr;
			var b = new Buffer(512);
			b[0] = 88; b[1] = 88; b[2] = 88; b[3] = 67; b[4] = 73; b[5] = 68;
			b[6] = QUERYSTATUS; b[7] = 1; 
			var i;
			for(i=0;i<addr.length;i++) {
				b[8+i] = addr.charCodeAt(i); 
			}
			for(;i<20;i++)
				b[8+i] = 0;
			b[28]=20;b[29]=0; // Repport Time
			var d = new Date();
			b[30] = d.getFullYear()>>8;
			b[31] = d.getFullYear()&0xff;
			b[32] = d.getMonth()+1;
			b[33] = d.getDate();
			b[34] = d.getHours();
			b[35] = d.getMinutes();
			b[36] = d.getSeconds();
			b[37] = weather_condition[2];
			b[38] = ((parseInt(weather_hi_temperature)+parseInt(weather_lo_temperature))/2-32)*5/9;
			b[39] = (parseInt(weather_hi_temperature)-32)*5/9;
			b[40] = 0;
			b[41] = 0;
			b[42] = 0x88;
			b[43] = 0x99;
			var ips=cfg['ip'].split('.');
			b[44] = parseInt(ips[0]);
			b[45] = parseInt(ips[1]);
			b[46] = parseInt(ips[2]);
			b[47] = parseInt(ips[3]);
			var targetaddr = db.getData('/roomID')
			if (targetaddr == addr.substr(1) && (g_phones != '')) {
				b[44+24*8] = 0xaa;
				b[44+24*8+1] = 0xff;
				var siplist = g_phones;
				if (siplist[0] == ',') {
					siplist = siplist.substr(1);
				}
				siplist=apexx_domain+","+siplist;
				b.write(siplist,44+24*8+2,siplist.length);
				b[44+24*8+2+siplist.length] = 0;
			}


			//console.log('38='+b[38]+' 39'+b[39]);
			//console.log('query equipment '+IP+' '+addr+' '+b[38]+' '+b[39]);
			server.send(b,0,b.length,8300,IP);
		});
	});
}

function search_all_equip()
{
        var b = new Buffer(512);
        b[0] = 88; b[1] = 88; b[2] = 88; b[3] = 67; b[4] = 73; b[5] = 68;
        b[6] = SEARCHALLEQUIP; b[7] = 1; 
        var i;
        b[28]=3;b[29]=0; // Repport Time
        var d = new Date();
        b[30] = d.getFullYear()>>8;
        b[31] = d.getFullYear()&0xff;
        b[32] = d.getMonth()+1;
        b[33] = d.getDate();
        b[34] = d.getHours();
        b[35] = d.getMinutes();
        b[36] = d.getSeconds();
        b[37] = weather_condition[2];
        b[38] = ((parseInt(weather_hi_temperature)+parseInt(weather_lo_temperature))/2-32)*5/9;
        b[39] = (parseInt(weather_hi_temperature)-32)*5/9;
        b[40] = 0;
        b[41] = 0;
	b[42] = (g_portal_ready==0)?0xC0:0xC1;
        //console.log('38='+b[38]+' 39'+b[39]);
        //console.log('Search all equipments b[42]='+b[42]);
        server.send(b,0,b.length,8300,'192.168.68.255');
        
}
function portal_start_polling()
{
	g_portal_timer = setTimeout(portal_start_polling,3000);
	var com=null;
	var mac;
	var addr = db.getData('/roomID');
	var now = (new Date()).getTime();
	var new_list = {};
	g_report_addr = '';
       	Object.keys(g_list).map(function(m) {
		var c = g_list[m];
		//console.log(c);
		//console.log(c.addr[0]+' '+c.addr[11]);
		if ((c.addr[0] == 'S') && (c.addr.substr(1)==addr)) {
			com = c;
			mac = m;
			g_report_addr = addr;
			g_report_mac = mac;
			g_report_ip = c.IP;
		}
		if (now-c.time < 60*1000) {
			new_list[m] = c;
		}
	});
	g_list = new_list;
	if (com) {
		console.log("XXXXXXXXXXXXXXXXX com.IP="+com.IP)
		if (com.IP != undefined) {
			console.log('YYYYY');
			portal_report(mac, com.addr, com.st, com.num,function(ret) {
				console.log('portal ret='+ret)
				if (ret == 'ok') {
					g_portal_ready = 1;
				} else {
					g_portal_ready = 0;
				}
				clearTimeout(g_portal_timer);
				g_portal_timer = setTimeout(portal_start_polling,1000);
			});
		} else {
			g_portal_ready = 0;
		}
	} else {
		g_portal_ready = 0;
	}

	var com1=null;
	var mac;
	var addr = db.getData('/roomID');
	addr[addr.length-1] = '7';
	var now = (new Date()).getTime();
	var new_list = {};
       	Object.keys(g_list).map(function(m) {
		var c = g_list[m];
		//console.log(c);
		//console.log(addr.substr(0,10) +' '+c.addr.substr(1,10));
		if ((c.addr[0] == 'S') && (c.addr.substr(1,10)==addr.substr(0,10) && c.addr[11] == '7')) {
			com1 = c;
			mac = m;
		}
		if (now-c.time < 60*1000) {
			new_list[m] = c;
		}
	});
	g_list = new_list;
	if (com1) {
		console.log("XXXXXXXXXXXXXXXXX com.IP1="+com1.IP+" mac="+mac+" addr="+addr)
		if (com1.IP != undefined) {
			console.log('YYYYY');
			portal_report(mac, com1.addr, com.st, com1.num,function(ret) {
				console.log('portal ret='+ret)
				if (ret == 'ok') {
					g_portal_ready = 1;
				} else {
					g_portal_ready = 0;
				}
				clearTimeout(g_portal_timer);
				g_portal_timer = setTimeout(portal_start_polling,1000);
			});
		} else {
			g_portal_ready = 0;
		}
	} else {
		g_portal_ready = 0;
	}

}


intercom_download_start = function(list,data_list,chunksize) {
	var ff=[];

	for(i=0;i<list.length;i++) {
		for(j=0;j<data_list.length;j++)
			ff.push({index:j,address:list[i], data:data_list[j][0], loca:data_list[j][1], x:data_list[j][2],y:data_list[j][3],w:data_list[j][4],h:data_list[j][5],type:data_list[j][6],pos:(j+1)*100/data_list.length});
	}
	intercom_download_list=ff;
	intercom_download_ret = 'progress'; 
	intercom_download_index = 0;
	intercom_download_result = {};
	console.log('------> download start');
	intercom_download_file(chunksize);
}

function intercom_download_file(ip,address,x,y,w,h,type,data,roomaddr,cb,chunksize) 
{
	var obj = new Object();

	obj.data = data;
	obj.ip = ip;
	obj.address = address;
	obj.type = type;
	obj.cb = cb;
	obj.ptr = 0;
	obj.x = x;
	obj.y = y;
	obj.w = w;
	obj.h = h;
	obj.roomaddr = roomaddr;
	obj.CHUNK_SIZE  = chunksize;

	intercom_download_file_start(obj);
	return obj;
}
function intercom_download_file_start(obj)
{
	var ptr=obj.ptr;
	var len;
	if (ptr + obj.CHUNK_SIZE < obj.data.length) {
		len = obj.CHUNK_SIZE;
	} else {
		len = obj.data.length-ptr;
	}

	console.log('download the next chunk from '+obj.ptr);
	var cobj = intercom_download_file_chunk(obj.ip,obj.address+obj.ptr,obj.x,obj.y,obj.w,obj.h,obj.type,obj.data.slice(ptr,ptr+len),function(r,err) {
		if (r == false) {
			//intercom_download_result[obj.address] = -1;
			if (err == '') {
				console.log('download fail');
				obj.cb(false);
			} else {
				console.log('download: retry the current chunk');
				intercom_download_file_start(obj);
			}
			return;
		}
		obj.ptr = obj.ptr + len;
		if (obj.ptr == obj.data.length) {
			console.log('end of stream: obj.address='+obj.address);
			intercom_download_result[obj.roomaddr] = 100;
			console.log('e.intercom_download_result['+obj.roomaddr+']='+intercom_download_result[obj.roomaddr]);
			obj.cb(true);
		} else {
			intercom_download_file_start(obj);
		}
	});
	cobj.offset = obj.ptr;
	cobj.totlength = obj.data.length;
}

function intercom_download_file_chunk(ip,address,x,y,w,h,type,data,cb)
{
	var index=0;
	var obj=new Object();

	obj.index = 0;
	obj.data = data;
	if (type == TYPE_QRCODE) {
		obj.type = TYPE_JPG;
	} else {
		obj.type = type;
	}
	obj.width = w;
	obj.height = h;
	obj.top = y;
	obj.left = x;
	obj.len = data.length;
	obj.ip = ip;
	obj.cb = cb;
	obj.address = address;
	obj.b = new Buffer(1500);
	var b = obj.b;
	b[0] = 88; b[1] = 88; b[2] = 88; b[3] = 67; b[4] = 73; b[5] = 68;
	if (type == TYPE_QRCODE || typeof(type) == "string")
		b[6] = UPLOADFILE;
	else
		b[6] = DOWNLOAD;
	b[7] = 0x1;
	b[8] = STARTDOWN;
	obj.b.write("xtm8130sdkkkkdfdsIM", 10);
	var i;
	var sum=0;
	if (type == TYPE_QRCODE) {
		obj.b.write("qrcode.jpg",30);
		obj.b[30+10] = 0;
	} else if (typeof(type) == "string") {
		obj.b.write(type,30);
		obj.b[30+type.length] = 0;
	} else {
		obj.b[30] = 0;
	}
	for(i=0;i<data.length;i++) {
		sum = sum + data[i];
		//console.log('sum='+(sum%256));
	}
	obj.sum = sum%256;
	console.log('sum='+(sum));
	obj.totpack = Math.floor((data.length+1023)/1024);
	obj.currpack = 0;
	if (obj.totpack==0) obj.totpack = 1;
	obj.b.writeUInt32LE(data.length,62);
	intercom_download_data(obj.ip,b.slice(0,100), 100, function(msg) {
		//console.log('ACK '+msg[8]);
		if (msg == false) {
			console.log('download fail');
			obj.cb(false,'');
		}
		if (msg[8] == STARTDOWN)
			intercom_download_file_1(obj);
		else if (msg[8] == DOWNFAIL) {
			obj.cb(false,'');
			return true;
		} else {
			return true;
		}
	});
	return obj;
}

intercom_download_data=function(targetip,data,len,cb) {
        console.log(data);
	intercom_download_data_timeout(targetip,data,len,cb,300);
}


intercom_download_data_timeout=function(targetip,data,len,cb,timeout) {
	console.log('----> send data to '+targetip);
	//console.log(data);
	intercom_multi_send(data,len,8300,targetip, function(r) {
		if (r == false) {
			console.log('download: fail');
			cb(false);
		} else {
			console.log('download: ack');
			return cb(r);
		}
	},timeout);
}

function intercom_multi_send(b,len,port,ip,cb,timeout)
{
	var obj = new Object();
	obj.b = b;
	obj.len = len;
	obj.ip = ip;
	obj.port = port;
	obj.retry=6;
	obj.cb = cb;
	obj.timeout = timeout;
	intercom_multi_send_list.push(obj);
	intercom_multi_send_try(obj);
}

var intercom_multi_send_list=[];
function intercom_multi_send_try(obj)
{
	//console.log('xxx '+obj.timeout);
	if (obj.port == 8300)
		server.send(obj.b,0,obj.len,obj.port,obj.ip);
	else
		server2.send(obj.b,0,obj.len,obj.port,obj.ip);
	obj.mytimeout = setTimeout(function() {
		obj.retry = obj.retry-1;
		//console.log('retry '+obj.retry);
		if (obj.retry == 0) {
			obj.cb(false);
			var i;

			for(i=0;i<intercom_multi_send_list.length;i++) {
				if (intercom_multi_send_list[i] == obj) {
					intercom_multi_send_list.splice(i,1);
					break;
				}
			}

			return;
		}
		intercom_multi_send_try(obj);
	},obj.timeout);
}

function intercom_multi_send_check(msg, ip)
{
	var i;

	for(i=0;i<intercom_multi_send_list.length;i++) {
		//console.log('search '+intercom_multi_send_list[i].b[6]+': found'+ intercom_multi_send_list[i].b[8]+' '+ msg[6]+':'+msg[8]);
		if (intercom_multi_send_list[i].b[6] == msg[6]) {
			if (intercom_multi_send_list[i].ip == ip) {
				new Fiber(function() {
					cb = intercom_multi_send_list[i].cb;
					var old  = intercom_multi_send_list[i];
					intercom_multi_send_list.splice(i,1);
					if (cb(msg) == false) {
						intercom_multi_send_list.push(old);
					} else {
						clearTimeout(old.mytimeout);
					}
				}).run();
				return;
			}
		}
	}
}



make_qrcode=function(text,cb) {
}
weather_update();
setTimeout(function() {
	search_all_equip();
},2000);
//setInterval(weather_update, 60*60*1000);
setInterval(weather_update, 10*1000);
setInterval(search_all_equip, 10*1000);
if (watchdog_init==0) {
	//exec("/usr/bin/watchdog set 160");
	watchdog_init = 1;
}

function fetch_phones()
{
	console.log("fetch phones for mac "+g_report_mac);
	var options = {
		hostname: 'plm.homescenario.com',
		path:'/phones?serialno='+g_report_mac,
		port:443,
		timeout:200,
		method:'GET'
	};
	var req = https.request(options, r => {
		var data = '';
		r.on('data',(d) => {
			data = data + d;
		});
		r.on('end',() => {
			console.log("\033[41m;"+data+"\033[m");
			try {
				g_phones=data;
			} catch(e) {
			}
		});
	});
	req.on('error', (error) => {
		if (error)
			console.log(error);
	});
	req.end();
}
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
setInterval(query_all_equip, 10*1000);
setInterval(fetch_phones, 10*1000);
portal_start_polling();

