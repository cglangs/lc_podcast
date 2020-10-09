import React, { Component } from 'react'
import gql from 'graphql-tag'
import { Mutation} from 'react-apollo'
import { withRouter } from 'react-router-dom';


const SIGNUP_MUTATION = gql`
  mutation SignupMutation($email: String!, $password: String!, $user_name: String!) {
    CreateUser(email: $email, password: $password, user_name: $user_name) {
      _id
      user_name
      password
      token
      role
    }
  }
`
const UPGRADE_MUTATION = gql`
  mutation UpgradeMutation($email: String!, $password: String!, $user_name: String!, $userId: Int!) {
    UpgradeUser(email: $email, password: $password, user_name: $user_name, userId: $userId) {
      _id
      user_name
      password
      token
      role
    }
  }
`

const LOGIN_MUTATION = gql`
  mutation LoginMutation($email: String!, $password: String!) {
    Login(email: $email, password: $password) {
      _id
      user_name
      password
      token
      role
    }
  }
`

class Login extends Component {
  state = {
    isLogin: true, // switch between Login and SignUp
    email: '',
    password: '',
    user_name: '',
    userId: null,
    role: "STUDENT"
  }

  componentDidMount(){
    if(this.props.user){
      const {user_name, _id ,role} = this.props.user
      this.setUserInfo(user_name, parseInt(_id), role)
    }
  }

  setUserInfo(user_name, userId, role){
    this.setState({user_name, userId:userId, role: role})

  }

 render() {
    const { isLogin, email, password, user_name, userId, role} = this.state
    console.log(this.state)
    return (
    <div>
      <h4>{isLogin ? 'Login' : 'Sign Up'}</h4>

      <div className="flex flex-column">
        {!isLogin && (
          <input
            value={user_name}
            onChange={e => this.setState({ user_name: e.target.value })}
            type="text"
            placeholder="Your name"
          />
        )}
        <input
          value={email}
          onChange={e => this.setState({ email: e.target.value })}
          type="text"
          placeholder="Your email address"
        />
        <input
          value={password}
          onChange={e => this.setState({ password: e.target.value })}
          type="password"
          placeholder="Choose a safe password"
        />
      </div>
      <div>
      <Mutation
        mutation={isLogin ? LOGIN_MUTATION : role === 'TESTER' ? UPGRADE_MUTATION :SIGNUP_MUTATION}
        variables={{ email, password, user_name, userId}}
        onCompleted={data => this._confirm(data)}
      >
        {mutation => (
          <button
            type="button"
            onClick={mutation}
          >
            {isLogin ? 'login' : 'create account'}
          </button>
        )}
      </Mutation>
      <button
        type="button"
        onClick={() => this.setState({ isLogin: !this.state.isLogin })}
      >
        {isLogin ? 'need to create an account?' : 'already have an account?'}
      </button>
      </div>
    </div>
  )

 }

 _confirm = async data => {
  this.props.refetchUser()
  this.props.history.push('/')
}


}


export default withRouter(Login)