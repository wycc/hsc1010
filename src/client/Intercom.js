import React, { Component } from 'react';
import { Button,TextField } from 'mdbreact';
import {la,lang_get} from './lang';


export default class Intercom extends Component {
  state = { sipID:'',mode:'home',roomID:'',list:null,pinCode:'',report_addr:'',portal_status:'',phones:'',qrcode:''};

  componentDidMount() {
    var self = this;
    fetch('/api/db?name=/sipID&cmd=get')
      .then(res => { 
	      console.log(res);
	      return res.json();
	})
      .then(val => {
	      console.log(val);
	      if (val)
	      	self.setState({ sipID: ''+val});
      });
    fetch('/api/db?name=/papip&cmd=get')
      .then(res => { 
	      console.log(res);
	      return res.json();
	})
      .then(val => {
	      console.log(val);
	      if (val)
	      	self.setState({ papip: ''+val});
      });
    fetch('/api/db?name=/roomID&cmd=get')
      .then(res => { 
	      console.log(res);
	      return res.json();
	})
      .then(val => {
	      console.log(val);
	      if (val)
	      	self.setState({ roomID: ''+val});
      });
      var self = this;
      setInterval(function() {
	  fetch('/api/list').then(res=>{return res.json()}).then(list => {
	  	self.setState({list:list});
	  });
	  fetch('/api/phones').then(res=>{return res.json()}).then(list => {
	  	self.setState({phones:list});
	  });
	  fetch('/api/registrations').then(res=>{return res.json()}).then(list => {
		console.log(list);
		var regs ={};
		var i;
		for(i=0;i<list.length;i++) {
			regs[list[i]['User']] = list[i]['agent'];
		}
	  	self.setState({registrations:regs});
	  });
	  fetch('/api/report_addr').then(res=>{return res.text()}).then(addr=> {
		self.setState({report_addr:addr});
	  });
	  fetch('/api/portal_status').then(res=>{return res.text()}).then(st=> {
		if (st == '0') {
			self.setState({portal_status:la('Not Available')});
		} else {
			self.setState({portal_status:la('Ready')});
		}
	  });
      },1000);
  }


  onID = (event) => {
	  this.setState({sipID:event.target.value});

  }
  onPapIP = (event) => {
	  this.setState({papip:event.target.value});

  }
  onRoomID = (event) => {
	  this.setState({roomID:event.target.value});

  }
  onSet = () => {
	  var self = this;
	  fetch('/api/db?name=/roomID&cmd=set&value='+this.state.roomID)
		  .then(res=> {return res.text()})
		  .then(val => {
			  self.setState({mode:'home'});
		  });
	  fetch('/api/db?name=/sipID&cmd=set&value='+this.state.sipID)
		  .then(res=> {return res.text()})
		  .then(val => {
			  self.setState({mode:'home'});
		  });
	  fetch('/api/db?name=/papip&cmd=set&value='+this.state.papip)
		  .then(res=> {return res.text()})
		  .then(val => {
			  self.setState({mode:'home'});
		  });
  }

  renderSIP() {
	  return (
			  <div> 
				{la('SIP ID:')}
			  	<TextField value={this.state.sipID} onChange={this.onID} /><br/>
		  		{la('Gateway IP:')}
			  	<TextField value={this.state.papip} onChange={this.onPapIP} /><br/>
		  		{la('Room ID:')}
			  	<TextField value={this.state.roomID} onChange={this.onRoomID} /><br/>
				<Button onClick={this.onSet}>{la("Set")}</Button>
				<Button onClick={()=> {this.setState({"mode":"resetpush"})}}>{la("Reset Push")}</Button>
			  </div>
		 );
  }

  onTest=() => {

	fetch('/api/sendmessage?title='+_('Test Message')+'&message='+_('Test Message')+'&addr='+this.state.roomID)
		.then(res=> {
			return res.json();
		}).then(ret => {
			if (ret.ok) {
				alert('OK');
			} else {
				alert(ret.message);
			}
		});
  }

  onPin=() => {
	var self = this;
	fetch('/api/setid?addr=' + this.state.roomID)
		  .then(res => {
			return res.text();
		  }).then(r=>{
			self.setState({pinCode:r});
		  });
  }
  onPinDone=()=> {
	  this.setState({pinCode:''});
  }

  renderList() {
	  if (this.state.list==null) return '';
	  var self = this;
	  var list = Object.keys(this.state.list).map(function(key) {
		  var c = self.state.list[key];
		  var addr = c.addr;
		  var t='';

		  if (addr[0] == 'S') {
			  if (addr[11] == '7') {
				  t = 'HSC-48';
			  } else {
				  t = la('Indoor Station');
			  }
		  } else if (addr[0] == 'H') {
			  t = la('DoorBell');
		  } else if (addr[0] == 'R') {
			  t = la('Video transcoder');
		  } else {
			  t = la('Others');
		  }
		  return <tr><td>{c.addr}</td><td>{c.IP}</td><td>{key}</td><td>{t}</td></tr>;
	  });

	  return (
			  <div>
			  	{la('Equipment List')}
			  	<table border="1">
					<tbody>
						{list}
					</tbody>
				</table>
			  </div>
	  );
  }


  renderLine() {
	  if (this.state.report_addr=='') {
		  return (
			  <div>
			  	<span>{la('Please check if the indoor statrion with matched roomID is available in the equipment list')}</span>
			  	<div>RoomID: {this.state.roomID}</div>
			  </div>
		  );
	  }
	  if (this.state.pinCode=='') {

		  if (lang_get() == 'en') {
			  return (
				  <div>
					  <span>{la('Scan the following QRcode in the Line APP.')}</span><br/>
					  <img src="https://qr-official.line.me/sid/L/530raldg.png" /><br/>
					  <Button onClick={this.onPin}>{la('Get registration code')}</Button>
				  </div>
			  );
		  } else {
			  return (
				  <div>
					  <span>{la('Scan the following QRcode in the Line APP.')}</span><br/>
					  <img src="https://qr-official.line.me/M/vNlQwoS0jr.png" /><br/>
					  <Button onClick={this.onPin}>{la('Get registration code')}</Button>
				  </div>
			  );
		  }
	  } else {
		  return (
			  <div>
			  	<span>{la('Use the following code as your registration code,')}</span><br/>
				<span style={{fontSize:'32px',color:'green'}}>{this.state.pinCode}</span><br/>
				  <Button onClick={this.onPinDone}>{la('Done')}</Button>
			  </div>
		  );
	  }
  }
  show_qrcode(p) {
	  this.setState({qrcode:p});
  }

  find_phone_registration(p) {
	  try {
		  var r = this.state.registrations[p];
		  return r;
	  } catch(e) {
		  return 'Not used';
	  }
  }
  render_qrcode_phone(p) {
	  var reg = this.find_phone_registration(p);
	  return <div><a onClick={()=> {this.show_qrcode(p)}}>{p}-{reg}</a></div>
  }
  renderPhones() {
	  var self = this;
	  return this.state.phones.split(',').map(function(p) {return self.render_qrcode_phone(p);})
		  
  }
  enableSIP() {
	  fetch('/api/enable_sip').then(res=>{return res.text()}).then(ret => {
		  alert(ret);
	  });
  }
  enableLine() {
	  fetch('/api/enable_line').then(res=>{return res.text()}).then(ret => {
		  alert(ret);
	  });
  }

  disableSIP() {
	  fetch('/api/disable_sip').then(res=>{return res.text()}).then(ret => {
		  alert(ret);
	  });
  }
  disableLine() {
	  fetch('/api/disable_line').then(res=>{return res.text()}).then(ret => {
		  alert(ret);
	  });
  }


  // <img src={'/api/qrcode?roomid='+this.state.roomID+'&sipID='+this.state.sipID} />
  renderHome() {
	  var img = '';
	  if (this.state.qrcode!='') {
		img = <span><pre style={{margin:"0px"}}>   LinPhone QRCode</pre><br/><img src={'/api/qrcode_img?number='+this.state.qrcode} /></span>;
	  }
	  return (
			  <div>
		  	  <br/>
		  	  <table border="1">
		  	  	<tbody>

				  <tr><td>{la('SIP ID:')}</td><td width="400px"> {this.state.sipID}</td></tr>
			  	  <tr><td>{la('SIP client numbers:')}</td>
			  	      <td><pre>{this.renderPhones()}</pre></td></tr>
				  <tr><td>{la('Phone Gateway IP:')}</td> <td>{this.state.papip}</td></tr>
			  	  <tr><td>{la('Room ID:')}</td><td>{this.state.roomID}</td></tr>
			  	  <tr><td>{la('Portal:')}</td><td>{this.state.portal_status}</td></tr>
		  		</tbody>
		  	  </table>
			  <table><tbody>
				  <tr>
					  <td><Button onClick={()=> {this.setState({'mode':'SIP'})}}>{la('Change')}</Button></td>
					  <td><Button onClick={this.onTest}>{la('Test')}</Button></td>
		  			  <td rowspan="3">{img}</td>

				  </tr>
				  <tr>
					  <td><Button onClick={()=> {this.enableLine();}}>{la('Enable Line')}</Button></td>
					  <td><Button onClick={()=> {this.disableLine();}}>{la('Disable Line')}</Button></td>
		  		  </tr>
		  		  <tr>
					  <td><Button onClick={()=> {this.enableSIP();}}>{la('Enable SIP')}</Button></td>
					  <td><Button onClick={()=> {this.disableSIP();}}>{la('Disable SIP')}</Button></td>
				  </tr>
			  </tbody></table>

			  {this.renderLine()}
			  {this.renderList()}
			  </div>
	);
  }
  onResetPush() {
	  var self = this;
	  fetch('/api/reset_push').then(res=>{return res.text()}).then(ret => {
		  alert(ret);
		  self.setState({mode:'SIP'});

	  });
  }

  renderResetPush() {
	  return <div> {la('We are about to reset the authorization code of the push message service. The Line will not work any more until we set another authorization code.')}
	  		<br/>
	  		<Button onClick={this.onResetPush}>{la('Reset')}</Button>
	  		<Button onClick={()=>{this.setState({mode:'SIP'})}}>{la('Abort')}</Button>
	  		<Button onClick={()=>{this.setState({mode:'homeserver'})}}>{la('Authorize Push')}</Button>
		  </div>
  }
  renderHomeServer() {
	  var ip,port;
	  var url;
	  if (window.location.port == '') {
		  url = 'http://'+window.location.hostname+':1780';
	  } else {
		  var pp = parseInt(window.location.port)+1;
		  url = 'http://'+window.location.hostname+':'+pp;
	  }
	  return <div>
		  <Button onClick={()=>{this.setState({mode:'SIP'})}}>{la('Abort')}</Button><br/>
		  <iframe width='100%' height='500px' src={url}></iframe>
		 </div>
  }
  render() {

	  if (this.state.pinCode != '') {
		  return this.renderLine();
	  }
	  if (this.state.mode == 'home') {
		  return this.renderHome();
	  } else if (this.state.mode == 'SIP') {
		  return this.renderSIP();
	  } else if (this.state.mode == 'resetpush') {
		  return this.renderResetPush();
	  } else if (this.state.mode == 'homeserver') {
		  return this.renderHomeServer();
	  }
  }
}
