# XIAO nRF52840 Plus

This board package uses the `Generic_nRF52840` SDK target. XIAO pin labels are mapped to the Generic variant's linear GPIO numbers (`P0.xx` = `xx`, `P1.xx` = `32 + xx`).

Pin mapping follows the [Seeed Studio XIAO nRF52840 Series documentation](https://wiki.seeedstudio.com/XIAO_BLE/).

Direct GPIO APIs use the mapped XIAO pins. The Generic SDK variant still constructs its global `Wire`, `SPI`, and `Serial` objects with Generic-board defaults; `board.json` bus pin entries are metadata and do not rebind those core objects. Code that uses the XIAO hardware buses must create/configure bus instances with the mapped chip pins, or use a dedicated XIAO variant.
