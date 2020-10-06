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

  setUserInfo(user_name, userId, role){
    this.setState({user_name: user_name, userId: userId, role: role})
  }

  removeUserInfo(){
    this.setState(this.baseState)
  }


  render() {
      return(
    <div>
      <Header />
      <div>
        <Switch>
          <Route exact path="/" component={Home} />
          {getRole() === 'ADMIN' && (<Route exact path="/author" component={Author} />)}
          {getRole() === 'ADMIN' && (<Route exact path="/editor" component={Editor} />)}
          {getRole() === 'ADMIN' && (<Route exact path="/words" component={Words} />)}
          {getRole() === 'ADMIN' && (<Route exact path="/wordedit" component={WordEdit} />)}
          <Route exact path="/play" component={Play} />
          <Route exact path="/login" component={Login} />
        </Switch>
      </div>
    </div>
    )
  }

}

export default App
