import React from 'react'
import { Switch, Route } from 'react-router-dom'
import Login from './Login'
import Header from './Header'
import Author from './Author'
import Play from './Play'

const App = () => (
  <div>
    <Header />
    <div>
      <Switch>
        <Route exact path="/" component={Author} />
        <Route exact path="/play" component={Play} />
        <Route exact path="/login" component={Login} />
      </Switch>
    </div>
  </div>
)

export default App
