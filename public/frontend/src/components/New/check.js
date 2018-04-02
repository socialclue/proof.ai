import React, { Component } from 'react';
import NewUser from './new'
import InstallPixel from './install-pixel'
import ConfigLeads from './capture-leads'
import ConfigNotification from './configure-notification'

export default class Check extends Component {
 
 constructor(props){
 	super(props)
 	this.state = {
 		active : 1
 	}
 	
 }	
 componentDidmount(){
 	
 }
 activeState(val){ 	    
 	if(val.tab){
 		this.setState({
 			active: val.tab.active
 		})
 		
 	}else{
 		this.setState({
 			active: val.active
 		})
 	}

 }

  render() {  	  
		switch (this.state.active) {
			case 1:
			   return <NewUser  callbackFromParent ={this.activeState.bind(this)}/>
			case 2:
			   return <InstallPixel  callbackFromParent ={this.activeState.bind(this)}/>  
			case 3:
			   return <ConfigLeads  callbackFromParent ={this.activeState.bind(this)}/>
			case 4:
				return <ConfigNotification callbackFromParent ={this.activeState.bind(this)}/>
		}	   
	}

}