import pandas as pd
import streamlit as st

def render_bwt_stages(stages, max_display=100):
    """
    Renders the intermediate stages of the BWT pipeline in Streamlit.
    """
    if not stages:
        return
        
    orig = stages["original"][:max_display]
    bwt = stages["bwt_out"][:max_display]
    mtf = stages["mtf_out"][:max_display]
    
    # Safe representation of bytes
    def safe_repr(b_arr):
        return [repr(bytes([b])) if isinstance(b, int) else repr(b) for b in b_arr]
        
    def safe_mtf(b_arr):
        return [str(b) for b in b_arr]

    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.subheader("1. Original Data")
        df1 = pd.DataFrame({"Data": safe_repr(orig)})
        st.dataframe(df1, use_container_width=True)
        
    with col2:
        st.subheader("2. BWT Output")
        st.caption(f"(Primary Index: {stages['primary_index']})")
        df2 = pd.DataFrame({"Data": safe_repr(bwt)})
        st.dataframe(df2, use_container_width=True)
        
    with col3:
        st.subheader("3. MTF Output")
        st.caption("(Integers before RLE)")
        df3 = pd.DataFrame({"Data": safe_mtf(mtf)})
        st.dataframe(df3, use_container_width=True)
        
    if len(stages["original"]) > max_display:
        st.caption(f"Showing first {max_display} bytes...")
