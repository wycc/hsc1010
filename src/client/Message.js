import React, { Component } from 'react';
import { Button,MDBInput,TextField } from 'mdbreact';
import la from './lang';
export default class Message extends Component {
	state = {message:'',title:'',roomID:''}
  	componentDidMount() {
	    var self = this;
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
	}
	onSend = () => {
		fetch('/api/sendmessage?title='+this.state.title+'&message='+this.state.message+'&addr='+this.state.roomID)
			.then(res => {
				return res.text();
			})
			.then(list => {
				alert(list);
			});
		
	}

	onChangeTitle= (event) => {
		this.setState({title: event.target.value});
	}

	onChangeMessage = (event) => {
		this.setState({message: event.target.value});
	}
	render() {
		return (
				<div>
				<MDBInput label={la("please input title here")} value={this.state.title} onChange={this.onChangeTitle} />
				<MDBInput type="textarea" label={la("please input message here")} value={this.state.message} rows="5" onChange={this.onChangeMessage} />
				<Button onClick={this.onSend}>{la("Send")}</Button>
				</div>

		);
	}
};
