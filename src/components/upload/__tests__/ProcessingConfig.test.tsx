import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProcessingConfig } from '../ProcessingConfig'

describe('ProcessingConfig', () => {
  it('should render with default configuration', () => {
    const mockOnConfigChange = vi.fn()
    render(<ProcessingConfig onConfigChange={mockOnConfigChange} />)

    expect(screen.getByText('Configurações de Processamento')).toBeInTheDocument()
    expect(screen.getByText('Personalize como a IA vai processar seu vídeo')).toBeInTheDocument()
  })

  it('should display all configuration options', () => {
    const mockOnConfigChange = vi.fn()
    render(<ProcessingConfig onConfigChange={mockOnConfigChange} />)

    // Check for main configuration sections
    expect(screen.getByText('Duração dos clips')).toBeInTheDocument()
    expect(screen.getByText('Quantidade de clips')).toBeInTheDocument()
    expect(screen.getByText('Idioma do vídeo')).toBeInTheDocument()
    expect(screen.getByText('Tipo de conteúdo')).toBeInTheDocument()
    expect(screen.getByText('Opções Avançadas')).toBeInTheDocument()
  })

  it('should call onConfigChange when clip duration is changed', () => {
    const mockOnConfigChange = vi.fn()
    render(<ProcessingConfig onConfigChange={mockOnConfigChange} />)

    // Find the duration select by its label
    const durationLabel = screen.getByText('Duração dos clips')
    const durationSelect = durationLabel.parentElement?.querySelector('button')
    expect(durationSelect).toBeInTheDocument()
    
    fireEvent.click(durationSelect!)

    const option60 = screen.getByText('60 segundos (YouTube Shorts)')
    fireEvent.click(option60)

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        clipDuration: 60,
        clipCount: 'auto',
        language: 'auto',
        contentType: 'auto',
        generateSubtitles: false,
        optimizeForMobile: false,
        removesilence: false,
        enhanceAudio: false
      })
    )
  })

  it('should call onConfigChange when clip count is changed', () => {
    const mockOnConfigChange = vi.fn()
    render(<ProcessingConfig onConfigChange={mockOnConfigChange} />)

    // Find the count select by its label
    const countLabel = screen.getByText('Quantidade de clips')
    const countSelect = countLabel.parentElement?.querySelector('button')
    expect(countSelect).toBeInTheDocument()
    
    fireEvent.click(countSelect!)

    const option5 = screen.getByText('5 clips')
    fireEvent.click(option5)

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        clipDuration: 30,
        clipCount: 5,
        language: 'auto',
        contentType: 'auto',
        generateSubtitles: false,
        optimizeForMobile: false,
        removesilence: false,
        enhanceAudio: false
      })
    )
  })

  it('should call onConfigChange when language is changed', () => {
    const mockOnConfigChange = vi.fn()
    render(<ProcessingConfig onConfigChange={mockOnConfigChange} />)

    // Find the language select by its label
    const languageLabel = screen.getByText('Idioma do vídeo')
    const languageSelect = languageLabel.parentElement?.querySelector('button')
    expect(languageSelect).toBeInTheDocument()
    
    fireEvent.click(languageSelect!)

    const optionPortuguese = screen.getByText('Português')
    fireEvent.click(optionPortuguese)

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        clipDuration: 30,
        clipCount: 'auto',
        language: 'pt',
        contentType: 'auto',
        generateSubtitles: false,
        optimizeForMobile: false,
        removesilence: false,
        enhanceAudio: false
      })
    )
  })

  it('should call onConfigChange when content type is changed', () => {
    const mockOnConfigChange = vi.fn()
    render(<ProcessingConfig onConfigChange={mockOnConfigChange} />)

    // Find the content type select by its label
    const contentTypeLabel = screen.getByText('Tipo de conteúdo')
    const contentTypeSelect = contentTypeLabel.parentElement?.querySelector('button')
    expect(contentTypeSelect).toBeInTheDocument()
    
    fireEvent.click(contentTypeSelect!)

    const optionTutorial = screen.getByText('Tutorial/Educacional')
    fireEvent.click(optionTutorial)

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        clipDuration: 30,
        clipCount: 'auto',
        language: 'auto',
        contentType: 'tutorial',
        generateSubtitles: false,
        optimizeForMobile: false,
        removesilence: false,
        enhanceAudio: false
      })
    )
  })

  it('should call onConfigChange when optimize for mobile is toggled', () => {
    const mockOnConfigChange = vi.fn()
    render(<ProcessingConfig onConfigChange={mockOnConfigChange} />)

    const mobileSwitch = screen.getByLabelText(/Otimizar para mobile/)
    fireEvent.click(mobileSwitch)

    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        clipDuration: 30,
        clipCount: 'auto',
        language: 'auto',
        contentType: 'auto',
        generateSubtitles: false,
        optimizeForMobile: true,
        removesilence: false,
        enhanceAudio: false
      })
    )
  })

  it('should work without onConfigChange prop', () => {
    render(<ProcessingConfig />)

    const mobileSwitch = screen.getByLabelText(/Otimizar para mobile/)
    fireEvent.click(mobileSwitch)

    // Should not throw error when onConfigChange is not provided
    expect(mobileSwitch).toBeInTheDocument()
  })
}) 