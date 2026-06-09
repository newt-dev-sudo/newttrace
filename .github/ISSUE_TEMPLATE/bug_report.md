---
name: Bug Report
description: Report a bug in newttrace
title: "[Bug]: "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug.
  - type: textarea
    id: description
    attributes:
      label: What happened?
      description: Describe the bug and what you expected to happen.
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction
      description: Steps to reproduce or a minimal code snippet.
      placeholder: |
        1. Initialize SDK with...
        2. Run bot...
        3. Observe error...
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Version
      description: newttrace version
      placeholder: e.g. 1.0.0
  - type: input
    id: environment
    attributes:
      label: Environment
      description: Node.js version and OS
      placeholder: e.g. Node 20, Windows 11
