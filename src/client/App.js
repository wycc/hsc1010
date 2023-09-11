import React, { Component } from 'react';
import './app.css';
import ReactImage from './react.png';
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap-css-only/css/bootstrap.min.css'; 
import 'mdbreact/dist/css/mdb.css';
import { Button, TextField } from 'mdbreact';
import { BrowserRouter as Router } from 'react-router-dom';
import { Fa, SideNavItem, SideNavCat, SideNavNav, SideNav, SideNavLink, Container, Box, Row } from 'mdbreact';
import { Navbar, NavbarBrand, NavbarNav, NavItem, NavLink, NavbarToggler, Collapse } from 'mdbreact';
import Intercom from './Intercom';
import Message from './Message';
import Network from './Network';
import Wizard from './Wizard';
import {la,lang_set,lang_get,lang_init,lang_change} from './lang';


class Login extends Component {
  	state = { user:'', pass:''} 
  	onUser=(event)=>{
		  this.setState({user:event.target.value});
	}
	onPass=(event)=>{
	  this.setState({pass:event.target.value});
	}
	onPassSet=(event) => {
	  fetch('/api/password?cmd=check&user='+this.state.user+'&pass='+this.state.pass).then(res => {
		return res.text();
	  }).then(r=> {
		if (r == 'ok') {
			var d = new Date();
			d.setTime(d.getTime() + (60 * 60 * 1000));
			var expires = "expires=" + d.toGMTString();
			document.cookie = "session_mui=test" + "; " + expires + '; path=/';
			window.location.reload();
		} else {
			alert(la('Login Failed'));
		}
	  });
		
	}
	render() {
		var style= { marginTop: 8,
			     display: 'flex',
			     flexDirection: 'column',
			     alignItems: 'center'};
		return (
				<Container component="main" maxWidth="xs" width='25ch'>
					{la('User:')}
					<TextField value={this.state.user} onChange={this.onUser}/><br/>
					{la('Password:')}
					<TextField value={this.state.pass} type='password' onChange={this.onPass}/><br/>
					<Button onClick={this.onPassSet}>{la("Login")}</Button>
				</Container>
		);
	}
}

export default class App extends Component {
  state = { lang:''}
  componentDidMount() {
	var self = this;
	fetch('/api/lang?cmd=get')
		.then(res => {return res.text()})
		.then( ret => {
			lang_change(ret);
			self.setState({lang:ret});
		});
  }
  render() {
	  var login = document.cookie.indexOf('session_mui') != -1;
	  if (login) {
		  return <App1/>
	  } else {
		  return <Login/>
	  }
  }
}

class App1 extends Component {
  state = { list: [], isLeftOpen:false, collapseID:'',page:'loading',sipID:'' };

  componentDidMount() {
    var self = this;
    fetch('/api/db?name=/list&cmd=get')
      .then(res => { 
	      console.log(res);
	      return res.json();
	})
      .then(list => {
	      this.setState({ list: list});
      });
      fetch('/api/db?name=/sipID&cmd=get')
      .then(res => { 
	      console.log(res);
	      return res.json();
	})
      .then(val => {
	      if (val.length!=0)
	      	self.setState({ page: 'home'});
	      else
		self.setState({ page:'wizard'});
      });

  }

  renderList() {
	  return this.state.list.map(function(v) {
		  return <div>{v}</div>
	  });
  }

  onClick = () => {
	  var l = this.state.list;
	  l.push('1111');
	  this.setState({list: l});
	  fetch('/api/db?name=/list&value='+JSON.stringify(l)+'&cmd=set');
  }
  toggleCollapse = collapseID => () => {
      this.setState(prevState => ({ collapseID: (prevState.collapseID !== collapseID ? collapseID : '') }));
  }

  render1() {
    const { username } = this.state;
    const createButton = (onClick, side) => {
	    return '';
    }

    return (
	    <Router>
	    	<Container>
			<Row style={{height: "80vh", alignItems: "center"}} >
				{createButton(this.handleToggleClickA, "Left")}
				{createButton(this.handleToggleClickB, "Right")}
			</Row>
			<SideNav hidden triggerOpening={this.state.isLeftOpen} breakWidth={1300} className="deep-purple darken-4">
				<SideNavNav id="intercom-cat" name="Intercom" icon="mail" >
					<SideNavLink>Parameters</SideNavLink>
				</SideNavNav>
			</SideNav>
		</Container>

	    </Router>
    );
  }

  renderContent() {
	  if (this.state.page == 'home') {
		  return '';
	  } else if (this.state.page == 'network') {
		  return <Network />;
	  } else if (this.state.page == 'intercom') {
		  return <Intercom />;
	  } else if (this.state.page == 'message') {
		  return <Message />;
	  } else {
		  return <div>{this.state.page} is not defined</div>
	  }
  }

  onIntercom = () => {
	  this.setState({page:'intercom',collapseID:''});
  }
  onNetwork = () => {
	  this.setState({page:'network',collapseID:''});
  }
  onMessage = () => {
	  this.setState({page:'message',collapseID:''});
  }
  onShutdown = () => {
	  fetch('/api/shutdown')
	  	.then(res => { return res.text()})
	  	.then(ret => {});
  }
  onLogout = () => {
	var d = new Date();
	d.setTime(d.getTime() -1);
	var expires = "expires=" + d.toGMTString();
	document.cookie = "session_mui=test; expires=" + expires + '; path=/';
	window.location.reload();
  }
  render() {
    const { username } = this.state;


    if (this.state.page == 'loading') {
	    return (
			    <div>
			    {la('Loading')}
			    </div>
	    );
    } else if (this.state.page == 'wizard') {
	    return <Wizard onDone={()=> this.setState({page:'home'})} />;
    }
    return (
	<Router>
	    <Container>
		<Navbar color="light-blue lighten-4" style={{marginTop: '20px'}} light>
			<Container>
				<NavbarBrand> eBuilding</NavbarBrand>
				<NavbarToggler onClick={this.toggleCollapse('navbarCollapse1')} />
				<Collapse id="navbarCollapse1" isOpen={this.state.collapseID} navbar>
					<NavbarNav left>
						<NavItem active>
							<NavLink to="#!" onClick={this.onNetwork}>{la('Network')}</NavLink>
						</NavItem>
						<NavItem active>
							<NavLink to="#!" onClick={this.onIntercom}>{la('Intercom')}</NavLink>
						</NavItem>
						<NavItem active>
							<NavLink to="#!" onClick={this.onMessage}>{la('Message')}</NavLink>
						</NavItem>
						<NavItem active>
							<NavLink to="#!" onClick={this.onShutdown}>{la('Shutdown')}</NavLink>
						</NavItem>
						<NavItem active>
							<NavLink to="#!" onClick={this.onLogout}>{la('Logout')}</NavLink>
						</NavItem>
					</NavbarNav>
				</Collapse>
			</Container>
		</Navbar>
		{this.renderContent()}
	    </Container>
	</Router>

    );
  }
}
