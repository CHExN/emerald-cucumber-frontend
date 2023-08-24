import axios from 'axios'
import {message, Modal, notification} from 'ant-design-vue'
import moment from 'moment'
import store from '../store'
import db from 'utils/localstorage'
moment.locale('zh-cn')

// 统一配置
let EMERALD_REQUEST = axios.create({
  // baseURL: 'http://123.57.145.17:9527/',
  baseURL: 'http://localhost:9527/',
  responseType: 'json',
  validateStatus (status) {
    // 200 外的状态码都认定为失败
    return status === 200
  }
})

// 拦截请求
EMERALD_REQUEST.interceptors.request.use((config) => {
  let expireTime = store.state.account.token.tokenActivityTimeout
  // 让token早10秒种过期，提升“请重新登录”弹窗体验
  if (expireTime <= 10) {
    Modal.error({
      title: '登录已过期',
      content: '很抱歉，登录已过期，请重新登录',
      okText: '重新登录',
      mask: false,
      onOk: () => {
        return new Promise((resolve, reject) => {
          db.clear()
          location.reload()
        }).catch(function (reason) {
          console.log('catch:', reason)
        })
      }
    })
  }
  // 有 token就带上
  if (store.state.account.token) {
    if (store.state.account.token.tokenName) {
      config.headers[store.state.account.token.tokenName] = store.state.account.token.tokenValue
    } else {
      config.headers.Authentication = store.state.account.token.tokenValue
    }
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// 拦截响应
EMERALD_REQUEST.interceptors.response.use((config) => {
  return config
}, (error) => {
  console.log(error)
  if (error.response) {
    console.log(error.response)
    let errorMessage = error.response.data === null ? '系统内部异常，请联系网站管理员' : error.response.data.message
    switch (error.response.status) {
      case 404:
        notification.error({
          message: '系统提示',
          description: '很抱歉，资源未找到',
          duration: 4
        })
        break
      case 401:
        notification.warn({
          message: '登录提示',
          description: errorMessage,
          duration: 4
        })
        break
      case 403:
        // Modal.warning(reRegister)
        const key = `open${Date.now()}`
        notification.warn({
          message: '权限提示',
          description: '很抱歉，您无法访问该资源，可能是因为没有相应权限或者登录已失效',
          duration: 4,
          btn: (h) => {
            return h('a-button', {
              on: {
                click: () => {
                  db.clear()
                  location.reload()
                }
              }
            }, '尝试重新登录')
          },
          key
        })
        break
      case 501:
        notification.warn({
          message: '系统提示',
          description: '很抱歉，此功能暂未实现',
          duration: 4
        })
        break
      default:
        notification.error({
          message: '系统提示',
          description: errorMessage,
          duration: 4
        })
        break
    }
  }
  return Promise.reject(error)
})

// 把ajax中config的transformRequest独立出了复用
const transformRequest = (params) => {
  let result = ''
  Object.keys(params).forEach((key) => {
    if (!Object.is(params[key], undefined) && !Object.is(params[key], null)) {
      result += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&'
    }
  })
  return result
}
// 导出
const exportFile = (blob, fileName) => {
  if ('download' in document.createElement('a')) {
    const link = document.createElement('a')
    link.download = fileName
    link.style.display = 'none'
    link.href = URL.createObjectURL(blob)
    document.body.appendChild(link)
    link.click()
    URL.revokeObjectURL(link.href)
    document.body.removeChild(link)
  } else {
    navigator.msSaveBlob(blob, fileName)
  }
}
// 参数拼接
const paramSplice = (url, params) => {
  let paramStr
  if (params === {} || Object.is(params, undefined)) {
    paramStr = ''
  } else {
    paramStr = url.indexOf('?') > -1 ? '&' : '?'
    for (let key in params) {
      if (params.hasOwnProperty(key) && params[key] !== null && params[key] !== undefined) {
        paramStr += `${key}=${params[key]}&`
      }
    }
    // 去掉最后一个&
    paramStr = paramStr.substring(0, paramStr.length - 1)
  }
  return `${url}${paramStr}`
}

const request = {
  post (url, body = {}, params = {}) {
    return EMERALD_REQUEST.post(paramSplice(url, params), body, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },
  put (url, body = {}) {
    return EMERALD_REQUEST.put(url, body, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  },
  patch (url, params = {}) {
    return EMERALD_REQUEST.patch(url, params, {
      transformRequest: [transformRequest],
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  },
  get (url, params) {
    return EMERALD_REQUEST.get(paramSplice(url, params))
  },
  delete (url, params) {
    return EMERALD_REQUEST.delete(paramSplice(url, params))
  },
  export (url, body = {}, params = {}) {
    message.loading('导出数据中')
    return EMERALD_REQUEST.post(paramSplice(url, params), body, {
      transformRequest: [transformRequest],
      responseType: 'blob'
    }).then((r) => {
      const content = r.data
      const blob = new Blob([content])
      const fileName = `${new Date().getTime()}_导出结果.xlsx`
      exportFile(blob, fileName)
    }).catch((r) => {
      console.error(r)
      message.destroy()
      message.error('导出失败')
    })
  },
  download (url, fileName, body = {}, params = {}) {
    message.loading('文件传输中')
    return EMERALD_REQUEST.post(paramSplice(url, params), body, {
      transformRequest: [transformRequest],
      responseType: 'blob'
    }).then((r) => {
      const content = r.data
      const blob = new Blob([content])
      exportFile(blob, fileName)
    }).catch((r) => {
      console.error(r)
      message.destroy()
      message.error('下载失败')
    })
  },
  upload (url, body) {
    return EMERALD_REQUEST.post(url, body, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default request
