import React, { Component } from 'react'
import { connect } from 'react-redux'
import { accountSelector, web3Selector } from '../store/selectors'
const axios = require('axios')

// let response = null
// new Promise(async (resolve, reject) => {
//   try {
//     response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest', {
//       headers: {
//         'Access-Control-Allow-Origin': '*',
//         'X-CMC_PRO_API_KEY': '5683e8ff-7506-4c57-8d69-cb0df2388f8f'
//       },
//     })
//   } catch(e) {
//     response = null
//     console.log(e)
//     reject(e)
//   }
//   if (response) {
//     const json = response.data
//     console.log(json)
//     resolve(json)
//   }
// })

class Navbar extends Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark">
        <a className="navbar-brand" href="/#">Portfolio Token Exchange</a>
        {this.props.account
        ?
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <a
                className="nav-link small"
                href={`https://etherscan.io/address/${this.props.account}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {this.props.account}
              </a>
            </li>
          </ul>
        : <div className="collapse navbar-collapse">
              <ul className="navbar-nav ml-auto">
                { this.props.web3
                ? <button
                    type="Success"
                    className="btn btn-outline btn-block "
                    style={{ backgroundColor: "#ffffff", color: "#000000" }}
                    onClick={async () => {
                      try {
                        await window.ethereum.enable()
                      } catch (e) {
                        console.log(e)
                      }
                    }}
                  >
                    Connect
                  </button>
                : <button
                    className="btn btn-warning"
                    type="button"
                    onClick={() => {
                      try {
                        window.open("https://metamask.io/")
                      } catch (e) {
                        console.log(e)
                      }
                    }}
                  >
                    Get MetaMask
                  </button>
                }
              </ul>
            </div>
          }
      </nav>
    )
  }
}

function mapStateToProps(state) {
  return {
    account: accountSelector(state),
    web3: web3Selector(state)
  }
}

export default connect(mapStateToProps)(Navbar)