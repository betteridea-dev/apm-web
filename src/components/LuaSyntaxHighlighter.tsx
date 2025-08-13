import React from "react"
import { Light as BaseSyntaxHighlighter } from "react-syntax-highlighter"
import lua from "react-syntax-highlighter/dist/esm/languages/prism/lua"
import theme from "react-syntax-highlighter/dist/esm/styles/hljs/docco"

BaseSyntaxHighlighter.registerLanguage("lua", lua)

type Props = React.ComponentProps<typeof BaseSyntaxHighlighter>

const SyntaxHighlighter: React.FC<Props> = (props) => {
    return <BaseSyntaxHighlighter style={theme} {...props} />
}

export default SyntaxHighlighter


