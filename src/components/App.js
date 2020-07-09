import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import Login from './Login'
import Header from './Header'
import Author from './Author'
import Play from './Play'
import Home from './Home'
import {getRole} from '../constants.js'

class App extends Component {
  render() {
      return(
    <div>
      <Header />
      <div>
        <Switch>
          <Route exact path="/" component={Home} />
          {getRole() === 'ADMIN' && (<Route exact path="/author" component={Author} />)}
          <Route exact path="/play" component={Play} />
          <Route exact path="/login" component={Login} />
        </Switch>
      </div>
    </div>
    )
  }

}

export default App
