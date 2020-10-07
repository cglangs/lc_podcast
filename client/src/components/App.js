import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import Login from './Login'
import Header from './Header'
import Author from './Author'
import Editor from './Editor'
import Words from './Words'
import WordEdit from './WordEdit'
import Play from './Play'
import Home from './Home'
import {getRole} from '../constants.js'
import {deleteToken, setToken} from '../constants'



class App extends Component {
  constructor(){
    super()
    this.baseState = {
        user_name: null,
        userId: null,
        role: null
    }
    this.state = this.baseState
  }

  setUserInfo(user_name, userId, role, token){
    setToken(token)
    this.setState({user_name: user_name, userId: userId, role: role})
  }

  removeUserInfo(){
    deleteToken()
    this.setState(this.baseState)
  }


  render() {
      const user = this.state
      return(
    <div>
      <Header removeUserInfo={this.removeUserInfo.bind(this)} user={user}/>
      <div>
        <Switch>
          <Route exact path="/" component={Home} />
          {getRole() === 'ADMIN' && (<Route exact path="/author" component={Author} />)}
          {getRole() === 'ADMIN' && (<Route exact path="/editor" component={Editor} />)}
          {getRole() === 'ADMIN' && (<Route exact path="/words" component={Words} />)}
          {getRole() === 'ADMIN' && (<Route exact path="/wordedit" component={WordEdit} />)}
          <Route exact path="/play" render={() => (<Play  user={user} setUserInfo={this.setUserInfo.bind(this)} /> )} />
          <Route exact path="/login" render={() => (<Login user={user} setUserInfo={this.setUserInfo.bind(this)} />)} />
        </Switch>
      </div>
    </div>
    )
  }

}

export default App
