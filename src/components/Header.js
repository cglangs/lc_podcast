import React from 'react'
import { Link } from 'react-router-dom'

const Header = props => (
  <div>
    <div>
      <div>Chinese App</div>
      <Link to="/">
        Author
      </Link>
      <div>|</div>
      <Link to="/play">
        Play
      </Link>
    </div>
  </div>
)

export default Header