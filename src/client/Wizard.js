
import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Fa, SideNavItem, SideNavCat, SideNavNav, SideNav, SideNavLink, Container, Row } from 'mdbreact';
import { Navbar, NavbarBrand, NavbarNav, NavItem, NavLink, NavbarToggler, Collapse } from 'mdbreact';
import { Button,TextField } from 'mdbreact';
import la from './lang';


export default class Intercom extends Component {
  state = { progress:false,sipID:'',mode:'home',roomID:'',list:[],pinCode:'',page:'step1',indoor:null,doorbell:null,ehome:null};

  componentDidMount() {
      var self = this;
      setInterval(function() {
	  fetch('/api/list').then(res=>{return res.json()}).then(list => {
	  	self.setState({list:list});
	  	var list = Object.keys(self.state.list).map(function(key) {
		  var c = self.state.list[key];
		  var addr = c.addr;
		  var t='';

		  if (addr[0] == 'S') {
			  if (addr[11] == '7') {
				  self.setState({ehome:c});
			  } else {
				  self.setState({indoor:c});
			  }
		  } else if (addr[0] == 'H') {
			  self.setState({doorbell:c});
		  }
	        });
	  });
      },1000);
  }

  onNext = (event)=> {
	  var self=this;

	  this.setState({progress:true});
	  fetch('/api/enable_sip?ip='+this.state.indoor.IP).then(res=> {
		  return res.text();
	  }).then( r=> {
		if (r != 'ok') {
			alert(la("Can not enable the SIP of indoor station. err=")+r);
		} else {
			fetch('/api/hsc48_set?addr='+this.state.indoor.addr+'&ip='+this.state.ehome.IP).then(res=> {
				return res.text();
			}).then(r=> {
				if (r != 'ok') {
					alert(la("Can not setup the room ID of eHome controller. err=")+r);
				} else {
					self.setState({progress:false,page:'step2',roomID:this.state.indoor.addr.substr(1,11)});
				}
			});
		}
	  });

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
		  return <tr key={key}><td>{c.addr}</td><td>{c.IP}</td><td>{key}</td><td>{t}</td></tr>;
	  });
	  return list;
  }
  checkStation() {
	  var msgs=[];
	  if (this.state.indoor == null) {
		  msgs.push(<div key={1}>{la('Can not find the indoor station. Please make sure the network is attached correctly.')}</div>);
	  }
	  if (this.state.doorbell == null) {
		  msgs.push(<div key={2}>{la('Can not find the doorbell. Please make sure the network is attached correctly.')}</div>);
	  }
	  if (this.state.indoor != null && this.state.doorbell != null) {
		  if (this.state.indoor.addr.substr(1,10) != this.state.doorbell.addr.substr(1,10)) {
		  	msgs.push(<div key={3}>{la('The address of the indoor station and the doorbell is not matched. Please use the paring mode of the indoor station to pair them.')}</div>);
		  	msgs.push(<div key={4}>{la('Click the followin link to see the detail.')}<a href="https://www.youtube.com/watch?v=AcZ5lKrcoUY">link</a></div>);
		  }
	  }
	  if (this.state.indoor && this.state.indoor.IP == '') {
		  msgs.push(<div> key={5}>{la('Search the IP of the indoor station')}</div>);
	  }
	  return msgs;
  }

  onID = (event) => {
	  this.setState({sipID:event.target.value});

  }
  onRoomID = (event) => {
	  this.setState({roomID:event.target.value});

  }
  onSet = (event) => {
	  var self = this;
	  fetch('/api/db?name=/roomID&cmd=set&value='+this.state.roomID)
		  .then(res=> {return res.text()})
		  .then(val => {
		  });
	  fetch('/api/db?name=/sipID&cmd=set&value='+this.state.sipID)
		  .then(res=> {return res.text()})
		  .then(val => {
			  //self.setState({page:'step3'});
			  self.props.onDone();
		  });
  }
  renderPage() {
	  if (this.state.page == 'step1') {
		  var msgs = this.checkStation();
		  return (
			<div>
			     <br/>
			     {msgs}
			     <br/>
			     <table border="1">
			         <tbody>
			             {this.renderList()}
				 </tbody>
		             </table>
			     <br/>
			     {msgs.length == 0 && this.state.progress == false && <Button onClick={this.onNext}>{la('Next')}</Button>}
		        </div>
	          );
		
	  } else if (this.state.page == 'step2') {
		  return (
			<div>
				<div>
				{la('Please iinput the SIP ID and Room ID provided by your vendor.')}
				</div>
			  	SIP ID:
			  	<TextField value={this.state.sipID} onChange={this.onID} /><br/>
			  	Room ID:
			  	<TextField value={this.state.roomID} onChange={this.onRoomID} /><br/>
				<Button onClick={this.onSet}>{la("Set")}</Button>
			</div>
		  );
	  } else if (this.state.page == 'step3') {
		  return (
			<div>
				<div>

				</div>
			</div>
		  );
	  } else {
	  	return <div>Unknown error in wizard</div>;
	  }

  }
  render() {
	  return (
			  
		<Router>
		    <Container>
			<Navbar color="light-blue lighten-4" style={{marginTop: '20px'}} light>
				<Container>
					<NavbarBrand>{la('Quick Installation Wizard')}</NavbarBrand>
				</Container>
			</Navbar>
			{this.renderPage()}
		    </Container>
		</Router>

	  );
  }
}
