import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { getToken, deleteToken, deleteRole, deleteUserName, getRole, deleteUserId } from '../constants'

class Header extends Component {

  render() {
    const isLoggedIn = !!getToken();

    return (
      <div>
        <div>Chinese App</div>
        <Link to="/">
            home
          </Link>
          <div>
        {isLoggedIn && getRole() === 'ADMIN' && (
          <div>
            <div className="flex">
              <Link to="/author">
                author
              </Link>
            </div>
            <div className="flex">
              <Link to="/editor">
                editor
              </Link>
            </div>
            <div className="flex">
              <Link to="/words">
                words
              </Link>
            </div>
          </div>
          )}
            <div className="flex">
              <Link to="/play">
                play
              </Link>
            </div>
          </div>   
        <div className="flex flex-fixed">
          {isLoggedIn ? (
            <div
              onClick={() => {
                deleteToken()
                deleteUserName()
                deleteRole()
                deleteUserId()
                this.props.history.push('/')
              }}
            >
              logout
            </div>
          ) : (
            <Link to="/login">
              login
            </Link>
          )}
        </div>
      </div>
    )
  }
}

export default withRouter(Header)