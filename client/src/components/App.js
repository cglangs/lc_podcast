import React, { Component } from 'react'
import { Switch, Route } from 'react-router-dom'
import Login from './Login'
import Header from './Header'
import Author from './Author'
import Editor from './Editor'
import Words from './Words'
import WordEdit from './WordEdit'
import Play from './Play'
import About from './About'
import Citations from './Citations'

import {Query} from 'react-apollo';
import gql from 'graphql-tag';


const GET_USER = gql`
query getUser {
  me {
    _id
    user_name
    role
    password
    token
  }
}
`





class App extends Component {

  render() {
    return(
      <div>
      <Query query={GET_USER}>
      {({ loading, error, data, refetch }) => {
        if (loading) return <div>Fetching</div>
        if (error) return <div>error</div>
        const user = data.me
        console.log(user)
        return(
        <div>
          <Header user={user} refetchUser={refetch}/>
          <Switch>
            <Route exact path="/" render={() => (<Play  user={user} refetchUser={refetch}/> )} />
            {user && user.role === 'ADMIN' && (<Route exact path="/author" component={Author} />)}
            {user && user.role === 'ADMIN' && (<Route exact path="/editor" component={Editor} />)}
            {user && user.role === 'ADMIN' && (<Route exact path="/words" component={Words} />)}
            {user && user.role === 'ADMIN' && (<Route exact path="/wordedit" component={WordEdit} />)}
            <Route exact path="/login" render={() => (<Login user={user} refetchUser={refetch}/>)} />
            <Route exact path="/about" component={About} />
            <Route exact path="/citations" component={Citations} />
          </Switch>
        {/*TODO: ADD footer with email adress*/}
        </div>
        )
      }}
      </Query>
      </div>
    )
  }

}

export default App
