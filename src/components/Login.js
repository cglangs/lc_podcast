import React from 'react'
import { setToken, getToken } from '../token'
import gql from 'graphql-tag'
import { useMutation } from 'urql'
import { useQuery } from 'urql'


const SIGNUP_MUTATION = gql`
  mutation SignupMutation($email: String!, $password: String!, $user_name: String!) {
    CreateUser(email: $email, password: $password, user_name: $user_name) {
      token
    }
  }
`

const LOGIN_QUERY = gql`
  query LoginQuery($email: String!, $password: String!) {
    User(email: $email, password: $password) {
      password
      token
    }
  }
`

const Login = props => {
  // Used to switch between login and signup
  const [isLogin, setIsLogin] = React.useState(true)

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

  React.useEffect(() => {
    if(!getToken() && loginResult.data && loginResult.data['User']){
      const token = loginResult.data['User'].token
        if (token) {
          setToken(token)
          props.history.push('/')
       } else{
        console.log("ERROR")
       }
    }
  });

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
  }, [executeMutation, props.history, email, password, user_name]);




  
  return (
    <div>
      <h4>{isLogin ? 'Login' : 'Sign Up'}</h4>

      <div className="flex flex-column">
        {!isLogin && (
          <input
            value={user_name}
            onChange={e => setUserName(e.target.value)}
            type="text"
            placeholder="Your name"
          />
        )}
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="text"
          placeholder="Your email address"
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          placeholder="Choose a safe password"
        />
      </div>

      <div>
      <button
        type="button"
        disabled={signUpState.fetching}
        onClick={isLogin ? login : signUp}
      >
        {isLogin ? "login" : "create account"}
      </button>
      <button
        type="button"
        disabled={signUpState.fetching}
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? 'need to create an account?' : 'already have an account?'}
      </button>
      </div>
    </div>
  )
}

export default Login