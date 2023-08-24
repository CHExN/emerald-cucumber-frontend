<template>
  <a-card :bordered="false" class="card-area">
    <div :class="advanced ? 'search' : null">
      <!-- 搜索区域 -->
      <a-form layout="horizontal">
        <a-row >
        <div :class="advanced ? null: 'fold'">
            <a-col :md="12" :sm="24" >
              <a-form-item
                label="用户名"
                :labelCol="{span: 4}"
                :wrapperCol="{span: 18, offset: 2}">
                <a-input v-model="queryParams.username"/>
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24" >
              <a-form-item
                label="部门"
                :labelCol="{span: 4}"
                :wrapperCol="{span: 18, offset: 2}">
                <dept-input-tree @change="handleDeptChange"
                                 ref="deptTree">
                </dept-input-tree>
              </a-form-item>
            </a-col>
          <template v-if="advanced">
            <a-col :md="12" :sm="24" >
              <a-form-item
                label="创建时间"
                :labelCol="{span: 4}"
                :wrapperCol="{span: 18, offset: 2}">
                <range-date @change="handleDateChange" ref="createTime"></range-date>
              </a-form-item>
            </a-col>
          </template>
        </div>
          <span style="float: right; margin-top: 3px;">
            <a-button type="primary" @click="search">查询</a-button>
            <a-button style="margin-left: 8px" @click="reset">重置</a-button>
             <a @click="toggleAdvanced" style="margin-left: 8px">
              {{advanced ? '收起' : '展开'}}
              <a-icon :type="advanced ? 'up' : 'down'" />
            </a>
          </span>
        </a-row>
      </a-form>
    </div>
    <div>
      <div class="operator">
        <a-button type="primary" ghost @click="add" v-hasPermission="['user:add']">新增</a-button>
        <a-button @click="batchDelete" v-hasPermission="['user:delete']">删除</a-button>
        <a-dropdown v-hasAnyPermission="['user:reset','user:export']">
          <a-menu slot="overlay">
            <a-menu-item v-hasPermission="['user:reset']" key="password-reset" @click="resetPassword">密码重置</a-menu-item>
            <a-menu-item v-hasPermission="['user:export']" key="export-data" @click="exportExcel">导出Excel</a-menu-item>
          </a-menu>
          <a-button>
            更多操作 <a-icon type="down" />
          </a-button>
        </a-dropdown>
      </div>
      <!-- 表格区域 -->
      <a-table ref="TableInfo"
               :columns="columns"
               :rowKey="record => record.id"
               :dataSource="dataSource"
               :pagination="pagination"
               :loading="loading"
               :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
               :scroll="{ x: 900 }"
               @change="handleTableChange">
        <template slot="email" slot-scope="text, record">
          <a-popover placement="topLeft">
            <template slot="content">
              <div>{{text}}</div>
            </template>
            <p style="width: 150px;margin-bottom: 0">{{text}}</p>
          </a-popover>
        </template>
        <template slot="operation" slot-scope="text, record">
          <a-icon v-hasPermission="['user:update']" type="setting" theme="twoTone" twoToneColor="#4a9ff5" @click="edit(record)" title="修改用户"></a-icon>
          &nbsp;
          <a-icon v-hasPermission="['user:view']" type="eye" theme="twoTone" twoToneColor="#42b983" @click="view(record)" title="查看"></a-icon>
          <a-badge v-hasNoPermission="['user:update','user:view']" status="warning" text="无权限"></a-badge>
        </template>
      </a-table>
    </div>
    <!-- 用户信息查看 -->
    <user-info
      :userInfoData="userInfo.data"
      :userInfoVisible="userInfo.visible"
      @close="handleUserInfoClose">
    </user-info>
    <!-- 新增用户 -->
    <user-add
      @close="handleUserAddClose"
      @success="handleUserAddSuccess"
      :userAddVisible="userAdd.visible">
    </user-add>
    <!-- 修改用户 -->
    <user-edit
      ref="userEdit"
      @close="handleUserEditClose"
      @success="handleUserEditSuccess"
      :userEditVisible="userEdit.visible">
    </user-edit>
  </a-card>
</template>

<script>
import UserInfo from './UserInfo'
import DeptInputTree from '../dept/DeptInputTree'
import RangeDate from '@/components/datetime/RangeDate'
import UserAdd from './UserAdd'
import UserEdit from './UserEdit'

export default {
  name: 'User',
  components: {UserInfo, UserAdd, UserEdit, DeptInputTree, RangeDate},
  data () {
    return {
      advanced: false,
      userInfo: {
        visible: false,
        data: {}
      },
      userAdd: {
        visible: false
      },
      userEdit: {
        visible: false
      },
      queryParams: {},
      filteredInfo: null,
      pageSortInfo: {},
      dataSource: [],
      selectedRowKeys: [],
      loading: false,
      pagination: {
        pageSizeOptions: ['10', '20', '30', '40', '100'],
        defaultCurrent: 1,
        defaultPageSize: 10,
        showQuickJumper: true,
        showSizeChanger: true,
        showTotal: (total, range) => `显示 ${range[0]} ~ ${range[1]} 条记录，共 ${total} 条记录`
      }
    }
  },
  computed: {
    columns () {
      let { filteredInfo, pageSortInfo } = this
      filteredInfo = filteredInfo || {}
      return [{
        title: '用户名',
        dataIndex: 'username',
        sorter: true,
        sortOrder: pageSortInfo.sortField === 'username' && pageSortInfo.sortOrder
      }, {
        title: '性别',
        dataIndex: 'gender',
        customRender: (text, row, index) => {
          switch (text) {
            case 1:
              return '男'
            case 0:
              return '女'
            case 2:
              return '保密'
            default:
              return text
          }
        },
        filters: [
          { text: '男', value: '1' },
          { text: '女', value: '0' },
          { text: '保密', value: '2' }
        ],
        filterMultiple: false,
        filteredValue: filteredInfo.gender || null,
        onFilter: (value, record) => record.gender.toString().includes(value)
      }, {
        title: '邮箱',
        dataIndex: 'email',
        scopedSlots: { customRender: 'email' },
        width: 100
      }, {
        title: '部门',
        dataIndex: 'deptName'
      }, {
        title: '电话',
        dataIndex: 'mobile'
      }, {
        title: '状态',
        dataIndex: 'status',
        customRender: (text, row, index) => {
          switch (text) {
            case 0:
              return <a-tag color="red">锁定</a-tag>
            case 1:
              return <a-tag color="cyan">有效</a-tag>
            default:
              return text
          }
        },
        filters: [
          { text: '有效', value: '1' },
          { text: '锁定', value: '0' }
        ],
        filterMultiple: false,
        filteredValue: filteredInfo.status || null,
        onFilter: (value, record) => record.status.toString().includes(value)
      }, {
        title: '创建时间',
        dataIndex: 'createTime',
        sorter: true,
        sortOrder: pageSortInfo.sortField === 'createTime' && pageSortInfo.sortOrder
      }, {
        title: '操作',
        dataIndex: 'operation',
        scopedSlots: { customRender: 'operation' }
      }]
    }
  },
  mounted () {
    this.fetch()
  },
  methods: {
    onSelectChange (selectedRowKeys) {
      this.selectedRowKeys = selectedRowKeys
    },
    toggleAdvanced () {
      this.advanced = !this.advanced
      if (!this.advanced) {
        this.queryParams.createTimeStart = ''
        this.queryParams.createTimeEnd = ''
      }
    },
    view (record) {
      this.userInfo.data = record
      this.userInfo.visible = true
    },
    add () {
      this.userAdd.visible = true
    },
    handleUserAddClose () {
      this.userAdd.visible = false
    },
    handleUserAddSuccess () {
      this.userAdd.visible = false
      this.$message.success('新增用户成功，初始密码为1234qwer')
      this.search()
    },
    edit (record) {
      this.$refs.userEdit.setFormValues(record)
      this.userEdit.visible = true
    },
    handleUserEditClose () {
      this.userEdit.visible = false
    },
    handleUserEditSuccess () {
      this.userEdit.visible = false
      this.$message.success('修改用户成功')
      this.search()
    },
    handleUserInfoClose () {
      this.userInfo.visible = false
    },
    handleDeptChange (value) {
      this.queryParams.deptId = value || ''
    },
    handleDateChange (value) {
      if (value) {
        this.queryParams.createTimeStart = value[0]
        this.queryParams.createTimeEnd = value[1]
      }
    },
    batchDelete () {
      if (!this.selectedRowKeys.length) {
        this.$message.warning('请选择需要删除的记录')
        return
      }
      let that = this
      this.$confirm({
        title: '确定删除所选中的记录?',
        content: '当您点击确定按钮后，这些记录将会被彻底删除',
        centered: true,
        onOk () {
          let userIds = []
          let selectedRowKeysStr = ',' + that.selectedRowKeys.join(',') + ','
          userIds.push(that.dataSource.filter(f => { return selectedRowKeysStr.indexOf(',' + f.id + ',') > -1 }).map(m => { return m.id }))
          that.$delete('user/' + userIds.join(',')).then(() => {
            that.$message.success('删除成功')
            that.selectedRowKeys = []
            that.search()
          })
        },
        onCancel () {
          that.selectedRowKeys = []
        }
      })
    },
    resetPassword () {
      if (!this.selectedRowKeys.length) {
        this.$message.warning('请选择需要重置密码的用户')
        return
      }
      let that = this
      this.$confirm({
        title: '确定重置选中用户密码?',
        content: '当您点击确定按钮后，这些用户的密码将会重置为1234qwer',
        centered: true,
        onOk () {
          let usernames = []
          let selectedRowKeysStr = ',' + that.selectedRowKeys.join(',') + ','
          usernames.push(that.dataSource.filter(f => { return selectedRowKeysStr.indexOf(',' + f.id + ',') > -1 }).map(m => { return m.username }))
          that.$put('user/password/reset', {
            usernames: usernames.join(',')
          }).then(() => {
            that.$message.success('重置用户密码成功')
            that.selectedRowKeys = []
          })
        },
        onCancel () {
          that.selectedRowKeys = []
        }
      })
    },
    exportExcel () {
      this.$export('user/excel', {
        ...this.queryParams,
        ...this.handleFilter(this.filteredInfo)
      }, {...this.pageSortInfo})
    },
    search () {
      this.fetch({
        ...this.queryParams,
        ...this.handleFilter(this.filteredInfo)
      })
    },
    reset () {
      // 取消选中
      this.selectedRowKeys = []
      // 重置分页
      this.pagination.current = this.pagination.defaultCurrent
      this.pageSortInfo = {
        pageNum: this.pagination.defaultCurrent,
        pageSize: this.pagination.defaultPageSize
      }
      // this.pageSortInfo.pageNum = this.pagination.defaultCurrent
      // this.pageSortInfo.pageSize = this.pagination.defaultPageSize
      // 重置列过滤器规则
      this.filteredInfo = null
      // 重置查询参数
      this.queryParams = {}
      // 清空部门树选择
      this.$refs.deptTree.reset()
      // 清空时间选择
      if (this.advanced) {
        this.$refs.createTime.reset()
      }
      this.fetch()
    },
    handleTableChange (pagination, filters, sorter) {
      // 将这三个参数赋值给Vue data，用于后续使用
      this.filteredInfo = filters
      this.pageSortInfo = this.handlePageSort(pagination, sorter)

      this.userInfo.visible = false
      this.fetch({
        ...this.queryParams,
        ...this.handleFilter(this.filteredInfo)
      })
    },

    // TODO独立出来做成通用方法
    // 处理分页排序
    handlePageSort (pagination, sorter) {
      // 分页信息只需要 {当前页，每页条数，总条数}
      let {current, pageSize, total} = pagination
      // 排序信息只需要 {排序字段，排序方式}
      let {field, order} = sorter

      // 将分页信息和排序信息合并到一起，并把内部key值改为后端接收的参数名
      return {
        pageNum: current,
        pageSize: pageSize,
        totalRow: total,
        sortField: field,
        sortOrder: order
      }
    },

    // 处理过滤字段
    handleFilter (filters) {
      // 将filters内部的value值都取[0]
      let filteredInfo = {}
      for (let key in filters) {
        if (filters[key] == null) continue
        filteredInfo[key] = filters[key][0]
      }
      return filteredInfo
    },

    fetch (body = {}) {
      // 显示loading
      this.loading = true

      // 控制分页组件显示
      if (this.pageSortInfo.pageNum && this.pageSortInfo.pageSize) {
        this.pagination.current = this.pageSortInfo.pageNum
        this.pagination.pageSize = this.pageSortInfo.pageSize
      } else {
        this.pageSortInfo.pageNum = this.pagination.defaultCurrent
        this.pageSortInfo.pageSize = this.pagination.defaultPageSize
      }
      // body内有查询参数时，删除数据总量字段
      if (Object.keys(body).length > 0) {
        delete this.pageSortInfo.totalRow
      }

      this.$post('user/page', body, this.pageSortInfo).then((r) => {
        let data = r.data
        if (data.code === 1) {
          this.$message.error(data.message)
          return
        }
        data = data.data

        // 如果当前页无数据，但总条数大于0，则自动计算最后一页重新查询
        if (data.records.length === 0 && data.totalRow > 0) {
          this.pageSortInfo.pageNum = Math.ceil(data.totalRow / data.pageSize) || 1
          return this.fetch(body)
        }

        // 将后端返回的数据总量存入pageSortInfo，查询的时候自动带上，提高程序的查询效率。
        // 因为在一般的分页场景中，只有第一页的时候有必要去查询数据总量，第二页以后是没必要的（因为第一页已经拿到总量了），因此， 后续无参情况下再次查询时可以带入 totalRow
        this.pageSortInfo.totalRow = data.totalRow
        this.pagination = { ...this.pagination, total: data.totalRow }
        this.dataSource = data.records
        this.loading = false
      })
    }
  }
}
</script>
<style lang="less" scoped>
@import "../../../../static/less/Common";
</style>
