
import React, { Component } from 'react';
import { Button,TextField,MDBInputSelect } from 'mdbreact';
import {la,lang_set,lang_get} from './lang';


export default class Intercom extends Component {
  state = { lang:lang_get(),ip:'192.168.68.1',mask:'24',gateway:'192.168.68.100',mode:'normal'};


  componentDidMount() {
    var self = this;
    fetch('/api/net?cmd=get').then( res => {
	    return res.json();
    }).then(cfg => {
	    if (cfg.networkdetect == undefined) {
		    cfg.networkdetect = 1;
	    }
	    self.setState({ip:cfg.ip,mask:cfg.mask,gateway:cfg.gateway,sshport:cfg.sshport,networkdetect:cfg.networkdetect});
    });
    fetch('/api/password?cmd=get').then( res => {
	    return res.text();
    }).then(data => {
	    self.setState({user:data});
    });
  }

  onLang= (event) => {
	  this.setState({lang:event.target.value});
	  lang_set(event.target.value);
  }

  onSet=(event) => {
	if (this.state.ip.split('.').length != 4) {
		alert(_('Please check the IP format'));
		return;
	}
	if (this.state.gateway.split('.').length != 4) {
		alert(_('Please check the IP format'));
		return;
	}
	var mask = parseInt(this.state.mask);
	if (mask<=0 || mask >= 32) {
		alert(_('Mask must be the 1-32'));
		return;
	}
	var networkdetect = parseInt(this.state.networkdetect);
	if (networkdetect<0 || networkdetect > 1) {
		alert(_('Network Detect must be 0-1'));
		return;
	}
	var self = this;
	fetch('/api/net?cmd=set&ip='+this.state.ip+'&mask='+this.state.mask+'&gateway='+this.state.gateway+'&sshport='+this.state.sshport+'&networkdetect='+this.state.networkdetect).then(res => {
		return res.text();
	}).then(r=> {
		var timer = setInterval(function(){
			if (self.state.countdown == 0) {
				clearTimeout(timer);
				window.location.href='http://'+self.state.ip+'/';
				return;
			}
			self.setState({countdown:self.state.countdown-1});
		},1000);
		self.setState({mode:'countdown',countdown:30});
		
	});
  }
  onEdit=(event) => {
	  this.setState({mode:'edit'});
  }
  onAccount=(event) => {
	  this.setState({mode:'pass',pass:'',pass_again:''});
  }
  onIP=(event)=>{
	  this.setState({ip:event.target.value});
  }
  onMask=(event)=>{
	  this.setState({mask:event.target.value});
  }
  onGateway=(event)=>{
	  this.setState({gateway:event.target.value});
  }
  onSSHPort=(event)=>{
	  this.setState({sshport:event.target.value});
  }
  onUser=(event)=>{
	  this.setState({user:event.target.value});
  }
  onPass=(event)=>{
	  this.setState({pass:event.target.value});
  }
  onPassAgain=(event)=>{
	  this.setState({pass_again:event.target.value});
  }


  onNetworkDetect=(event)=>{
	  this.setState({networkdetect:event.target.value});
  }


  onAbort=(event)=> {
	  this.setState({mode:'normal'});
  }
  onPassSet=(event) => {
	  if (this.state.pass != this.state.pass_again) {
		  alert(la('Passwords does not match'));
		  return;
	  }
	  fetch('/api/password?cmd=set&user='+this.state.user+'&pass='+this.state.pass).then(res => {
		return res.text();
	  }).then(r=> {
		  if (r == 'ok') {
			  alert(la('Account is changed'))
	  		  this.setState({mode:'normal'});
		  } else {
			  alert(la('Failed to change account'));
		  }
	  });
  }

  render() {
	var options = [
		{
			text:"English",
			value:"en"
		},
		{
			text:"Traditional Chinese",
			value:"cht"
		}

	];
	var options = [];
	if (this.state.lang == 'en') {
		options.push(<option selected value="en">English</option>);
	} else {
		options.push(<option value="en">English</option>);
	}
	if (this.state.lang == 'cht') {
		options.push(<option selected value="cht">Traditional Chinese</option>);
	} else {
		options.push(<option value="cht">Traditional Chinese</option>);
	}
	if (this.state.mode == 'countdown') {
		return (
			<div>
			{this.state.countdown}
			</div>
		);
	}
	
	if (this.state.mode == 'edit') {
		return (
				<div>
					IP:
					<TextField value={this.state.ip} onChange={this.onIP} /><br/>
					{la('Mask(ex. 8,16,24):')}
					<TextField value={this.state.mask} onChange={this.onMask} /><br/>
			                {la('Default Gateway:')}
					<TextField value={this.state.gateway} onChange={this.onGateway} /><br/>
					{la('SSH Port:')}
					<TextField value={this.state.sshport} onChange={this.onSSHPort} /><br/>
					{la('Network Detect:')}
					<TextField value={this.state.networkdetect} onChange={this.onNetworkDetect} /><br/>
					<Button onClick={this.onSet}>{la("Set")}</Button>
					<Button onClick={this.onAbort}>{la("Abort")}</Button><br/>

				</div>
		)
	} else if (this.state.mode == 'pass') {
		return (
				<div>
					{la('User:')}
					<TextField value={this.state.user} onChange={this.onUser}/><br/>
					{la('Password:')}
					<TextField value={this.state.pass} type='password' onChange={this.onPass}/><br/>
			                {la('Password(again):')}
					<TextField value={this.state.pass_again} type='password' onChange={this.onPassAgain} /><br/>
					<Button onClick={this.onPassSet}>{la("Set")}</Button>
					<Button onClick={this.onAbort}>{la("Abort")}</Button><br/>

				</div>
		)

	} else {
		return (
				<div>
					IP: {this.state.ip}<br/>
					{la('Mask:')}
					{this.state.mask}<br/>
			                {la('Default Gateway:')}
					{this.state.gateway} <br/>
					{la('SSH Port:')}
					{this.state.sshport} <br/>
					{la('Network Detect(0:disable,1:enable):')}
					{this.state.networkdetect} <br/>
					<Button onClick={this.onEdit}>{la("Edit Network")}</Button>
					<Button onClick={this.onAccount}>{la("Change Password")}</Button>
					<br/>
					<br/>
					{la('Language')} : 
					<select onChange={this.onLang}> 
						{options}
					</select>
				</div>
		);
	}
  }
}


