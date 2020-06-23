import React from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { getToken, deleteToken } from '../token'

const Header = props => {
  const isLoggedIn = !!getToken();

  return (
    <div>
      <div>
        <div>Chinese App</div>
        <Link to="/">
          new
        </Link>
        {isLoggedIn && (
          <div className="flex">
            <div>|</div>
            <Link to="/play">
              submit
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-fixed">
        {isLoggedIn ? (
          <div
            onClick={() => {
              deleteToken()
              props.history.push('/')
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

export default withRouter(Header)