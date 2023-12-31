import db from 'utils/localstorage'

export default {
  namespaced: true,
  state: {
    token: db.get('USER_TOKEN'),
    user: db.get('USER'),
    permissions: db.get('PERMISSIONS'),
    roles: db.get('ROLES')
  },
  mutations: {
    setToken (state, val) {
      db.save('USER_TOKEN', val)
      state.token = val
    },
    setUser (state, val) {
      db.save('USER', val)
      state.user = val
    },
    setPermissions (state, val) {
      db.save('PERMISSIONS', val)
      state.permissions = val
    },
    setRoles (state, val) {
      db.save('ROLES', val)
      state.roles = val
    }
  }
}
