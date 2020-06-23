import React from 'react'
import ReactDOM from 'react-dom'
import './styles/index.css'
import App from './components/App'
import { BrowserRouter } from 'react-router-dom'
import { getToken } from './token'
import { Provider, Client, dedupExchange, fetchExchange } from 'urql'
import { cacheExchange } from '@urql/exchange-graphcache'

const cache = cacheExchange({})


const client = new Client({
  url: 'http://0.0.0.0:3003',
  fetchOptions: () => {
    const token = getToken()
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' }
    }
  },
  exchanges: [dedupExchange, cache, fetchExchange]
  })

ReactDOM.render(
  <BrowserRouter>
    <Provider value={client}>
      <App />
    </Provider>
  </BrowserRouter>,
  document.getElementById('root')
)
