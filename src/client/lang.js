var lang_cht={};

lang_cht['please input title here']='Ո';
lang_cht['Intercom']='對講機';
lang_cht['Network']='網路';
lang_cht['Message']='訊息';
lang_cht['Shutdown']='關機';
lang_cht['Set']='設定';
lang_cht['Test Message']='測試訊息';
lang_cht['Scan the following QRcode in the Line APP.']='在 Line APP 中掃描下面的 QRCode';
lang_cht['Get registration code']='取得認証碼';
lang_cht['Use the following code as your registration code,']='使用下面的碼做為你的認証碼';
lang_cht['Done']='完成';
lang_cht['Change']='更改';
lang_cht['Test']='測試';
lang_cht['please input title here']='請在這裡輸入標題';
lang_cht['please input message here']='請在這裡輸入訊息';
lang_cht['Send']='傳送';
lang_cht['Indoor Station']='室內機';
lang_cht['DoorBell']='小門口機';
lang_cht['Video transcoder']='影像轉換器';
lang_cht['Others']='其它';
lang_cht['Equipment List']='設備列表';
lang_cht['Quick Installation Wizard']='快速安裝精靈';
lang_cht['Please iinput the SIP ID and Room ID provided by your vendor.']='請使用經銷商提供的 SIP ID/ Room ID';
lang_cht['Set']='設定';
lang_cht['Search the IP of the indoor station']='尋找室內機的 IP';
lang_cht['Click the followin link to see the detail.']='按下後面的連結獲取進一步資訊';
lang_cht['The address of the indoor station and the doorbell is not matched. Please use the paring mode of the indoor station to pair them.']='室內機和小門口機的地方不相符，請使用室內機的配對模式設定小門 口機';
lang_cht['Can not find the doorbell. Please make sure the network is attached correctly.']='找不到小門口機。請檢查網路是否安裝正確';
lang_cht['Can not find the indoor station. Please make sure the network is attached correctly.']='找不到室內機。請檢查網路是否安裝正確';
lang_cht['Can not setup the room ID of eHome controller. err=']='無法設定 eHome 控制器。錯誤碼=';
lang_cht['Can not enable the SIP of indoor station. err=']='無法啟動室內機的 SIP. 錯誤碼= ';
lang_cht['Not available']='無法存取';
lang_cht['Ready']='在線';
lang_cht['Please check if the indoor statrion with matched roomID is available in the equipment list']='請檢查和房號符合的室內機是否在設備列表中';
lang_cht['Edit Network']='設定網路';
lang_cht['Language']='話言';
lang_cht['Traditional Chinese']='繁體中文';
lang_cht['Room ID:']='房號:';
lang_cht['SIP client numbers:']='SIP客戶號碼:';
lang_cht['Gateway IP:']='閘道器 IP:';
lang_cht['Portal:']='雲端平台:';
lang_cht['Enable Line']='啟用 Line';
lang_cht['Disable Line']='禁用 Line';
lang_cht['Enable SIP']='啟用 SIP';
lang_cht['Disable SIP']='禁用 SIP';
lang_cht['Abort']='放棄';
lang_cht['Reset Push']='重設推播';
lang_cht['We are about to reset the authorization code of the push message service. The Line will not work any more until we set another authorization code.']='即將重設推播訊息服務的授權碼。Line 將不再能收到訊息，直接重新授權';
lang_cht['Reset']='重設';
lang_cht['Authorize Push']='授權推播';
lang_cht['Phone Gateway IP:']='電話閘道器 IP';
lang_cht['Default Gateway:']='預設閘道器:';
lang_cht['Mask:']='網路遮罩:';
lang_cht['Mask(ex. 8,16,24):']='網路遮罩(8,16,24)';
lang_cht['Not used']='未使用';
lang_cht['Change Password']='更改密碼';
lang_cht['Logout']='登出';
lang_cht['User:']='使用者:';
lang_cht['Password:']='密碼:';
lang_cht['Password(again):']='密碼(再一次):';
lang_cht['Login']='登入';
lang_cht['Login Failed']='登入失敗';
lang_cht['']='';
lang_cht['']='';
var lang={};
var g_lang='';
function lang_init()
{
	fetch('/api/lang?cmd=get')
		.then(res => {return res.text()})
		.then( ret => {
			lang_change(ret);
		});
}
function lang_change(ret)
{
	if (ret == 'cht') {
		lang = lang_cht;
	} else {
		lang={};
	}
	g_lang = ret;
}
function lang_set(l)
{
	fetch('/api/lang?cmd=set&value='+l);
	lang_change(l);
}

function lang_get()
{
	return g_lang;
}


export default function la(msg) {
	if (lang[msg])
		return lang[msg];
	else
		return msg;
}

export {la,lang_set,lang_get,lang_init,lang_change};
