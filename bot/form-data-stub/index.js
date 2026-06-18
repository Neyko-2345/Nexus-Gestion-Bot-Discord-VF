class FormData {
  constructor() {
    this._fields = []
    this.boundary = '----FormBoundary' + Math.random().toString(36).substring(2)
  }
  append(name, value, options) {
    this._fields.push({ name, value, options })
  }
  getHeaders() {
    return { 'content-type': `multipart/form-data; boundary=${this.boundary}` }
  }
  getBuffer() {
    return Buffer.alloc(0)
  }
  getLengthSync() { return 0 }
  pipe() {}
  submit() {}
}
module.exports = FormData
module.exports.default = FormData
