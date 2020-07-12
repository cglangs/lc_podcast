import React, { Component } from 'react'
import { setToken, setRole } from '../constants'
import gql from 'graphql-tag'
import { Mutation} from 'react-apollo'


const SIGNUP_MUTATION = gql`
  mutation SignupMutation($email: String!, $password: String!, $user_name: String!) {
    CreateUser(email: $email, password: $password, user_name: $user_name) {
      token
    }
  }
`

const LOGIN_MUTATION = gql`
  mutation LoginMutation($email: String!, $password: String!) {
    Login(email: $email, password: $password) {
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
  }

   /*componentDidMount() {
    if(!getToken() && loginResult.data && loginResult.data['User']){
      const token = loginResult.data['User'].token
      const role = loginResult.data['User'].role
        if (token && role) {
          setToken(token)
          setRole(role)
          props.history.push('/')
       } else{
        console.log("ERROR")
       }
    }
  }*/

  // Used to switch between login and signup
  /*const [isLogin, setIsLogin] = React.useState(true)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [user_name, setUserName] = React.useState('')
  const [loginResult, executeQuery] = useQuery({
    query: LOGIN_QUERY,
    variables: { email, password},
    pause: true,
  })
  const login = React.useCallback(() => {
    executeQuery()
  }, [executeQuery]);
  const [signUpState, executeMutation] = useMutation(SIGNUP_MUTATION);
  
  const signUp = React.useCallback(() => {
    executeMutation({ email, password, user_name })
      .then(({ data }) => {
        const token = data && data['CreateUser'].token
        if (token) {
          setToken(token)
          props.history.push('/')
        }
      });
  }, [executeMutation, props.history, email, password, user_name]);*/


 render() {
    const { isLogin, email, password, user_name } = this.state
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
        mutation={isLogin ? LOGIN_MUTATION : SIGNUP_MUTATION}
        variables={{ email, password, user_name}}
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
  const { token, role } = data
  this._saveUserData(token, role)
  this.props.history.push(`/`)
}

  _saveUserData = (token,role) => {
    setToken(token)
    if(role){
      setRole(role)
    }
  }

}


export default Login