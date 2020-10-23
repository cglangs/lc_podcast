import React, { Component } from 'react'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { getCookie} from '../utils'

class Header extends Component {

  render() {
    const isLoggedIn = !!getCookie('access-token');

    return (
      <div>
        <div style={{"marginBottom": "10px"}}>Cloze Chinese</div>
        <Link to="/">
            Learn
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
        <div>  
          <Link to="/about">
              about
          </Link>
        </div> 
        <div>          
          <Link to="/citations">
              citations
          </Link>
        </div>
        <div className="flex flex-fixed">
          {isLoggedIn && this.props.user && this.props.user.role !== 'TESTER' ? (
            <div
              onClick={() => {
                document.cookie = "access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                document.cookie = "refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                this.props.history.push('/')
                window.location.reload(true);

                //this.props.refetchUser()
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