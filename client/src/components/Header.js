import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { getCookie} from '../utils'

class Header extends Component {

  render() {
    const isLoggedIn = !!getCookie('token');

    return (
      <div>
        <div>Chinese App</div>
        <Link to="/">
            play
          </Link>
          <div>
        {isLoggedIn && this.props.user && this.props.user.role === 'ADMIN' && (
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
          </div>   
        <div className="flex flex-fixed">
          {isLoggedIn && this.props.user && this.props.user.role !== 'TESTER' ? (
            <div
              onClick={() => {
                document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                this.props.refetchUser()
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