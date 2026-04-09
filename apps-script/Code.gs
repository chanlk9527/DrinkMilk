/**
 * Google Apps Script - 宝宝喝奶记录 API（家庭版）
 * 
 * 部署步骤：
 * 1. 打开 https://script.google.com，新建项目
 * 2. 把这段代码粘贴进去
 * 3. 点击 "部署" → "新建部署"
 * 4. 类型选 "Web 应用"
 * 5. "执行身份" 选 "我自己"
 * 6. "谁可以访问" 选 "任何人"
 * 7. 点部署，复制生成的 URL
 * 8. 把 URL 填到前端的 .env 文件里
 */

const INDEX_FILE = 'baby-milk-index.json'

function getIndexFile_() {
  const files = DriveApp.getFilesByName(INDEX_FILE)
  if (files.hasNext()) return files.next()
  return DriveApp.createFile(INDEX_FILE, JSON.stringify({ codes: {} }), 'application/json')
}

function readIndex_() {
  const file = getIndexFile_()
  return JSON.parse(file.getBlob().getDataAsString())
}

function writeIndex_(index) {
  const file = getIndexFile_()
  file.setContent(JSON.stringify(index, null, 2))
}

function familyFileName_(familyId) {
  return 'family-' + familyId + '.json'
}

function getFamilyFile_(familyId) {
  const name = familyFileName_(familyId)
  const files = DriveApp.getFilesByName(name)
  if (files.hasNext()) return files.next()
  return null
}

function readFamilyData_(familyId) {
  const file = getFamilyFile_(familyId)
  if (!file) throw new Error('家庭数据不存在')
  return JSON.parse(file.getBlob().getDataAsString())
}

function writeFamilyData_(familyId, data) {
  data.updatedAt = new Date().toISOString()
  let file = getFamilyFile_(familyId)
  if (!file) {
    file = DriveApp.createFile(familyFileName_(familyId), JSON.stringify(data, null, 2), 'application/json')
  } else {
    file.setContent(JSON.stringify(data, null, 2))
  }
}

function generateFamilyId_() {
  return 'f_' + new Date().getTime().toString(36) + Math.random().toString(36).slice(2, 6)
}

function generateFamilyCode_() {
  var code = ''
  for (var i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

function doGet(e) {
  var familyId = e.parameter.familyId
  if (!familyId) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: '缺少 familyId' }))
      .setMimeType(ContentService.MimeType.JSON)
  }
  var data = readFamilyData_(familyId)
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents)
    var action = body.action

    if (action === 'create_family') {
      var newId = generateFamilyId_()
      var code = generateFamilyCode_()
      var newData = {
        version: 1,
        familyId: newId,
        familyCode: code,
        babyName: body.babyName || '小宝',
        updatedAt: new Date().toISOString(),
        records: [],
        quickAmounts: [40, 50, 60, 70, 80, 90, 100, 110],
        presetTags: ['吐了一点', '吐了很多', '喝得很快', '喝得慢', '哭闹', '睡着了'],
        colorMap: {}
      }
      writeFamilyData_(newId, newData)
      var index = readIndex_()
      index.codes[code] = newId
      writeIndex_(index)
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, familyId: newId, familyCode: code }))
        .setMimeType(ContentService.MimeType.JSON)
    }

    if (action === 'join_family') {
      var familyCode = body.familyCode || ''
      var index = readIndex_()
      var existingId = index.codes[familyCode]
      if (!existingId) {
        return ContentService
          .createTextOutput(JSON.stringify({ ok: false, error: '家庭码不存在' }))
          .setMimeType(ContentService.MimeType.JSON)
      }
      var data = readFamilyData_(existingId)
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, familyId: existingId, familyCode: familyCode, babyName: data.babyName }))
        .setMimeType(ContentService.MimeType.JSON)
    }

    var familyId = body.familyId
    if (!familyId) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: '缺少 familyId' }))
        .setMimeType(ContentService.MimeType.JSON)
    }

    var data = readFamilyData_(familyId)

    if (action === 'add') {
      data.records.push(body.record)
    } else if (action === 'update') {
      data.records = data.records.map(function(r) { return r.id === body.record.id ? body.record : r })
    } else if (action === 'delete') {
      data.records = data.records.filter(function(r) { return r.id !== body.recordId })
    } else if (action === 'update_settings') {
      if (body.quickAmounts) data.quickAmounts = body.quickAmounts
    } else if (action === 'full_save') {
      writeFamilyData_(familyId, body.data)
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON)
    }

    writeFamilyData_(familyId, data)
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data: data }))
      .setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}
