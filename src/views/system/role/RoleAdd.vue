<template>
  <a-drawer
    title="新增角色"
    :maskClosable="false"
    width=650
    placement="right"
    :closable="false"
    @close="onClose"
    :visible="roleAddVisible"
    style="height: calc(100% - 55px);overflow: auto;padding-bottom: 53px;">
    <a-form :form="form">
      <a-form-item label='角色名称'
                   v-bind="formItemLayout"
                   :validateStatus="validateStatus"
                   :help="help">
        <a-input @blur="handleRoleNameBlur" v-decorator="['roleName']"/>
      </a-form-item>
      <a-form-item label='角色描述' v-bind="formItemLayout">
        <a-textarea
          :rows="4"
          v-decorator="[
          'remark',
          {rules: [
            { max: 50, message: '长度不能超过50个字符'}
          ]}]">
        </a-textarea>
      </a-form-item>
      <a-form-item label='权限选择'
                   style="margin-bottom: 2rem"
                   :validateStatus="menuSelectStatus"
                   :help="menuSelectHelp"
                   v-bind="formItemLayout">
        <a-tree
          :key="menuTreeKey"
          ref="menuTree"
          :checkable="true"
          :checkStrictly="checkStrictly"
          @check="handleCheck"
          @expand="handleExpand"
          :expandedKeys="expandedKeys"
          :treeData="menuTreeData">
        </a-tree>
      </a-form-item>
    </a-form>
    <div class="drawer-bootom-button">
      <a-dropdown style="float: left" :trigger="['click']" placement="topCenter">
        <a-menu slot="overlay">
          <a-menu-item key="1" @click="expandAll">展开所有</a-menu-item>
          <a-menu-item key="2" @click="closeAll">合并所有</a-menu-item>
          <a-menu-item key="3" @click="enableRelate">父子关联</a-menu-item>
          <a-menu-item key="4" @click="disableRelate">取消关联</a-menu-item>
        </a-menu>
        <a-button>
          树操作 <a-icon type="up" />
        </a-button>
      </a-dropdown>
      <a-popconfirm title="确定放弃编辑？" @confirm="onClose" okText="确定" cancelText="取消">
        <a-button style="margin-right: .8rem">取消</a-button>
      </a-popconfirm>
      <a-button @click="handleSubmit" type="primary" :loading="loading">提交</a-button>
    </div>
  </a-drawer>
</template>
<script>
const formItemLayout = {
  labelCol: { span: 3 },
  wrapperCol: { span: 18 }
}
export default {
  name: 'RoleAdd',
  props: {
    roleAddVisible: {
      default: false
    }
  },
  data () {
    return {
      menuTreeKey: +new Date(),
      loading: false,
      formItemLayout,
      form: this.$form.createForm(this),
      validateStatus: '',
      menuSelectStatus: '',
      help: '',
      menuSelectHelp: '',
      role: {
        roleName: '',
        remark: '',
        menuIds: []
      },
      checkedKeys: [],
      expandedKeys: [],
      menuTreeData: [],
      allTreeKeys: [],
      checkStrictly: true
    }
  },
  methods: {
    reset () {
      this.menuTreeKey = +new Date()
      this.expandedKeys = this.checkedKeys = []
      this.validateStatus = this.help = ''
      this.loading = false
      this.form.resetFields()
    },
    onClose () {
      this.reset()
      this.$emit('close')
    },
    expandAll () {
      this.expandedKeys = this.allTreeKeys
    },
    closeAll () {
      this.expandedKeys = []
    },
    enableRelate () {
      this.checkStrictly = false
    },
    disableRelate () {
      this.checkStrictly = true
    },
    handleCheck (checkedKeys) {
      this.checkedKeys = checkedKeys
      let checkedArr = Object.is(checkedKeys.checked, undefined) ? checkedKeys : checkedKeys.checked
      if (checkedArr.length) {
        this.menuSelectStatus = ''
        this.menuSelectHelp = ''
      } else {
        this.menuSelectStatus = 'error'
        this.menuSelectHelp = '请选择相应的权限'
      }
    },
    handleExpand (expandedKeys) {
      this.expandedKeys = expandedKeys
    },
    handleSubmit () {
      let checkedArr = Object.is(this.checkedKeys.checked, undefined) ? this.checkedKeys : this.checkedKeys.checked
      if (this.validateStatus !== 'success') {
        this.handleRoleNameBlur()
      } else if (checkedArr.length === 0) {
        this.menuSelectStatus = 'error'
        this.menuSelectHelp = '请选择相应的权限'
      } else {
        this.form.validateFields((err, values) => {
          if (!err) {
            this.setRoleFields()
            this.loading = true
            this.role.menuIds = checkedArr
            this.$post('role', {
              ...this.role
            }).then((r) => {
              this.reset()
              this.$emit('success')
            }).catch(() => {
              this.loading = false
            })
          }
        })
      }
    },
    handleRoleNameBlur () {
      let roleName = this.form.getFieldValue('roleName')
      roleName = typeof roleName === 'undefined' ? '' : roleName.trim()
      if (roleName.length) {
        if (roleName.length > 10) {
          this.validateStatus = 'error'
          this.help = '角色名称不能超过10个字符'
        } else {
          this.validateStatus = 'validating'
          this.$get(`role/check/${roleName}`).then((r) => {
            if (r.data) {
              this.validateStatus = 'success'
              this.help = ''
            } else {
              this.validateStatus = 'error'
              this.help = '抱歉，该角色名称已存在'
            }
          })
        }
      } else {
        this.validateStatus = 'error'
        this.help = '角色名称不能为空'
      }
    },
    setRoleFields () {
      let values = this.form.getFieldsValue(['roleName', 'remark'])
      if (typeof values !== 'undefined') {
        Object.keys(values).forEach(_key => { this.role[_key] = values[_key] })
      }
    }
  },
  watch: {
    roleAddVisible () {
      if (this.roleAddVisible) {
        this.$post('menu').then((r) => {
          this.menuTreeData = r.data.data.records.children
          this.allTreeKeys = r.data.data.ids
        })
      }
    }
  }
}
</script>
