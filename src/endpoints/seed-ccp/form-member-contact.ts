import { asFormData } from './helpers/cast'
import { h2, lexicalRoot } from './helpers/lexical'

export const memberContactForm = asFormData({
  title: 'Form liên hệ thành viên CCP',
  submitButtonLabel: 'Gửi yêu cầu',
  confirmationType: 'message',
  confirmationMessage: lexicalRoot([
    h2('Cảm ơn Quý tổ chức đã liên hệ. Bộ phận CCP sẽ phản hồi trong vòng 2 ngày làm việc.'),
  ]),
  fields: [
    {
      name: 'company-name',
      blockName: 'company-name',
      blockType: 'text',
      label: 'Tên tổ chức',
      required: true,
      width: 100,
    },
    {
      name: 'contact-name',
      blockName: 'contact-name',
      blockType: 'text',
      label: 'Người liên hệ',
      required: true,
      width: 100,
    },
    {
      name: 'email',
      blockName: 'email',
      blockType: 'email',
      label: 'Email',
      required: true,
      width: 100,
    },
    {
      name: 'phone',
      blockName: 'phone',
      blockType: 'text',
      label: 'Số điện thoại',
      required: true,
      width: 100,
    },
    {
      name: 'member-type',
      blockName: 'member-type',
      blockType: 'select',
      label: 'Loại thành viên',
      required: true,
      width: 100,
      options: [
        { label: 'CTCK', value: 'ctck' },
        { label: 'Ngân hàng', value: 'bank' },
        { label: 'Tổ chức khác', value: 'other' },
      ],
    },
    {
      name: 'subject',
      blockName: 'subject',
      blockType: 'select',
      label: 'Nội dung',
      required: true,
      width: 100,
      options: [
        { label: 'Gia nhập CCP', value: 'membership' },
        { label: 'Hỗ trợ kỹ thuật', value: 'technical' },
        { label: 'Đào tạo', value: 'training' },
        { label: 'Khác', value: 'other' },
      ],
    },
    {
      name: 'message',
      blockName: 'message',
      blockType: 'textarea',
      label: 'Nội dung chi tiết',
      required: true,
      width: 100,
    },
  ],
})
