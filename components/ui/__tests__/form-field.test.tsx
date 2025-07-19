import React from 'react'
import { render, screen } from '@testing-library/react'
import { FormField, Input, Textarea, Select } from '../form-field'

describe('FormField', () => {
  it('应该渲染基本的表单字段', () => {
    render(
      <FormField label="Test Field">
        <Input id="test-input" />
      </FormField>
    )

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('应该显示必填标记', () => {
    render(
      <FormField label="Required Field" required>
        <Input id="required-input" />
      </FormField>
    )

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('应该显示错误消息', () => {
    render(
      <FormField label="Error Field" error="This field is required" touched>
        <Input id="error-input" />
      </FormField>
    )

    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('应该不显示错误消息当字段未被触摸时', () => {
    render(
      <FormField label="Untouched Field" error="This field is required" touched={false}>
        <Input id="untouched-input" />
      </FormField>
    )

    expect(screen.queryByText('This field is required')).not.toBeInTheDocument()
  })

  it('应该显示帮助文本', () => {
    render(
      <FormField label="Help Field" helpText="This is help text">
        <Input id="help-input" />
      </FormField>
    )

    expect(screen.getByText('This is help text')).toBeInTheDocument()
  })

  it('应该优先显示错误消息而不是帮助文本', () => {
    render(
      <FormField 
        label="Priority Field" 
        error="Error message" 
        touched 
        helpText="Help text"
      >
        <Input id="priority-input" />
      </FormField>
    )

    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.queryByText('Help text')).not.toBeInTheDocument()
  })

  it('应该设置正确的aria属性', () => {
    render(
      <FormField label="Aria Field" error="Error message" touched>
        <Input id="aria-input" />
      </FormField>
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', 'aria-input-error')
  })

  it('应该应用错误样式到子组件', () => {
    render(
      <FormField label="Styled Field" error="Error message" touched>
        <Input id="styled-input" />
      </FormField>
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-300')
  })
})

describe('Input', () => {
  it('应该渲染基本输入框', () => {
    render(<Input placeholder="Test input" />)

    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument()
  })

  it('应该应用错误样式', () => {
    render(<Input error placeholder="Error input" />)

    const input = screen.getByPlaceholderText('Error input')
    expect(input).toHaveClass('border-red-300')
  })

  it('应该支持disabled状态', () => {
    render(<Input disabled placeholder="Disabled input" />)

    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed')
  })

  it('应该转发ref', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})

describe('Textarea', () => {
  it('应该渲染文本域', () => {
    render(<Textarea placeholder="Test textarea" />)

    expect(screen.getByPlaceholderText('Test textarea')).toBeInTheDocument()
  })

  it('应该应用错误样式', () => {
    render(<Textarea error placeholder="Error textarea" />)

    const textarea = screen.getByPlaceholderText('Error textarea')
    expect(textarea).toHaveClass('border-red-300')
  })

  it('应该设置最小高度', () => {
    render(<Textarea placeholder="Min height textarea" />)

    const textarea = screen.getByPlaceholderText('Min height textarea')
    expect(textarea).toHaveClass('min-h-[80px]')
  })

  it('应该转发ref', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })
})

describe('Select', () => {
  it('应该渲染选择框', () => {
    render(
      <Select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    )

    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('应该应用错误样式', () => {
    render(
      <Select error>
        <option value="1">Option 1</option>
      </Select>
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('border-red-300')
  })

  it('应该转发ref', () => {
    const ref = React.createRef<HTMLSelectElement>()
    render(
      <Select ref={ref}>
        <option value="1">Option 1</option>
      </Select>
    )

    expect(ref.current).toBeInstanceOf(HTMLSelectElement)
  })
})