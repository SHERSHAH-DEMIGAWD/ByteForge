import networkx as nx
import matplotlib.pyplot as plt
import io

def draw_huffman_tree(root):
    """
    Renders a Huffman tree using NetworkX and Matplotlib.
    Returns a bytes object containing a PNG image.
    """
    if root is None:
        return None

    G = nx.DiGraph()
    pos = {}
    labels = {}

    def add_edges(node, x=0, y=0, layer=1):
        if node is not None:
            node_id = id(node)
            pos[node_id] = (x, y)
            if node.char is not None:
                # Leaf node
                char_label = repr(bytes([node.char])) if isinstance(node.char, int) else repr(node.char)
                labels[node_id] = f"'{char_label}'\n{node.freq}"
            else:
                # Internal node
                labels[node_id] = str(node.freq)

            if node.left:
                left_id = id(node.left)
                G.add_edge(node_id, left_id, weight='0')
                add_edges(node.left, x - 1 / layer, y - 1, layer + 1)
            if node.right:
                right_id = id(node.right)
                G.add_edge(node_id, right_id, weight='1')
                add_edges(node.right, x + 1 / layer, y - 1, layer + 1)

    add_edges(root)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.axis('off')
    
    # Dark theme support
    fig.patch.set_facecolor('#0E1117')
    ax.set_facecolor('#0E1117')
    
    node_colors = ['#00AAFF' if id(root) != n else '#FF4B4B' for n in G.nodes()]

    nx.draw(G, pos, ax=ax, labels=labels, with_labels=True, 
            node_size=2000, node_color=node_colors, font_size=10, 
            font_color='white', font_weight='bold', edge_color='#4C4C54')

    edge_labels = nx.get_edge_attributes(G, 'weight')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_color='#00AAFF', ax=ax)

    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=150)
    plt.close(fig)
    buf.seek(0)
    return buf.getvalue()
