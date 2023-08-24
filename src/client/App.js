import React, { Component } from 'react';
import './app.css';
import ReactImage from './react.png';
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap-css-only/css/bootstrap.min.css'; 
import 'mdbreact/dist/css/mdb.css';
import { Button } from 'mdbreact';
import { BrowserRouter as Router } from 'react-router-dom';
import { Fa, SideNavItem, SideNavCat, SideNavNav, SideNav, SideNavLink, Container, Row } from 'mdbreact';
import { Navbar, NavbarBrand, NavbarNav, NavItem, NavLink, NavbarToggler, Collapse } from 'mdbreact';
import Intercom from './Intercom';
import Message from './Message';
import Network from './Network';
import Wizard from './Wizard';
import {la,lang_set,lang_get,lang_init} from './lang';


export default class App extends Component {
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

      lang_init();
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
