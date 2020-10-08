import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { getToken} from '../constants'

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
        {isLoggedIn && this.props.user.role === 'ADMIN' && (
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
          {isLoggedIn && this.props.user.role !== 'TESTER' ? (
            <div
              onClick={() => {
                this.props.removeUserInfo()
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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